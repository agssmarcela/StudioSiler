// Conexão com o WhatsApp do salão usando Baileys (WhatsApp Web, login por QR code).

import fs from 'node:fs';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  isJidGroup,
  isJidBroadcast,
  isJidNewsletter,
  isPnUser,
  isLidUser,
  jidDecode,
  jidNormalizedUser,
  normalizeMessageContent,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { soDigitos } from './telefone.js';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const numeroDoJid = (jid) => (jid ? jidDecode(jid)?.user ?? null : null);

/** Texto de uma mensagem (conversa, texto com formatação ou legenda de mídia). null se não houver texto. */
function extrairTexto(message) {
  const m = normalizeMessageContent(message);
  if (!m) return null;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    m.buttonsResponseMessage?.selectedDisplayText ??
    m.listResponseMessage?.title ??
    null
  );
}

/** Foto, PDF, áudio, vídeo ou figurinha (ex.: comprovante do pix). */
function temMidia(message) {
  const m = normalizeMessageContent(message);
  return !!(m?.imageMessage || m?.documentMessage || m?.documentWithCaptionMessage || m?.videoMessage || m?.audioMessage || m?.stickerMessage);
}

/** Mensagens que não são "conversa" (reações, edições, avisos de sistema...) */
function ehMensagemDeSistema(message) {
  const m = normalizeMessageContent(message);
  if (!m) return true;
  const chaves = Object.keys(m).filter((k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage');
  if (!chaves.length) return true;
  return chaves.every((k) => ['protocolMessage', 'reactionMessage', 'pollUpdateMessage', 'keepInMemoryMessage'].includes(k));
}

export class WhatsApp {
  constructor({ pastaAuth = 'auth', numeroSalao = null, log = console } = {}) {
    this.pastaAuth = pastaAuth;
    this.numeroSalao = numeroSalao ? soDigitos(numeroSalao) : null;
    this.log = log;
    this.sock = null;
    this.conectado = false;
    this.aoReceber = async () => {};
    this.aoAtendimentoManual = () => {};
    this.enviadosPeloBot = new Set();
    this.processadas = new Set();
    this.cacheJid = new Map();
    this.fila = Promise.resolve();
    this.tentativas = 0;
  }

  async iniciar() {
    const { state, saveCreds } = await useMultiFileAuthState(this.pastaAuth);
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      /* usa a versão padrão da biblioteca */
    }

    const sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    this.sock = sock;
    sock.ev.on('creds.update', saveCreds);

    // Login por código de pareamento (alternativa ao QR code)
    if (this.numeroSalao && !state.creds.registered) {
      await esperar(3000);
      try {
        const codigo = await sock.requestPairingCode(this.numeroSalao);
        this.log.info(`\n🔑 Código de pareamento: ${codigo}\n` +
          '   No celular do salão: WhatsApp > Dispositivos conectados > Conectar dispositivo > ' +
          'Conectar com número de telefone, e digite o código.\n');
      } catch (e) {
        this.log.error('Não consegui gerar o código de pareamento, use o QR code:', e.message);
      }
    }

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr && !this.numeroSalao) {
        this.log.info('\n📱 Escaneie o QR code com o WhatsApp do salão (Dispositivos conectados > Conectar dispositivo):\n');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'open') {
        this.conectado = true;
        this.tentativas = 0;
        this.log.info('✅ Conectado ao WhatsApp!');
      }
      if (connection === 'close') {
        this.conectado = false;
        const codigo = lastDisconnect?.error?.output?.statusCode;
        if (codigo === DisconnectReason.loggedOut) {
          this.log.error('🚪 O WhatsApp foi desconectado pelo celular. Apagando a sessão; rode o bot de novo para ler um novo QR code.');
          fs.rmSync(this.pastaAuth, { recursive: true, force: true });
          process.exit(1);
        }
        const espera = Math.min(60_000, 2_000 * 2 ** this.tentativas++);
        this.log.warn(`Conexão caiu (código ${codigo ?? '?'}). Reconectando em ${Math.round(espera / 1000)}s...`);
        await esperar(espera);
        this.iniciar().catch((e) => this.log.error('Erro ao reconectar:', e));
      }
    });

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      for (const m of messages) {
        // 'append' = mensagens enviadas pelo próprio bot ou recebidas enquanto ele estava offline.
        // Do próprio número, só interessam as digitadas no celular ('notify').
        if (m.key?.fromMe && type !== 'notify') continue;
        // Ignora mensagens muito antigas (ex.: bot ficou dias desligado)
        const enviadaEm = Number(m.messageTimestamp ?? 0) * 1000;
        if (enviadaEm && Date.now() - enviadaEm > 12 * 3600e3) continue;
        // processa uma mensagem por vez, na ordem em que chegaram
        this.fila = this.fila.then(() => this.tratar(m)).catch((e) => this.log.error('Erro ao tratar mensagem:', e));
      }
    });
  }

  async telefoneDe(jid, alternativo) {
    if (isPnUser(jid)) return numeroDoJid(jid);
    if (alternativo && isPnUser(alternativo)) return numeroDoJid(alternativo);
    if (isLidUser(jid)) {
      try {
        const pn = await this.sock.signalRepository?.lidMapping?.getPNForLID(jid);
        if (pn) return numeroDoJid(pn);
      } catch {
        /* sem mapeamento */
      }
    }
    return null;
  }

  async tratar(m) {
    const jid = m.key?.remoteJid;
    if (!jid || !m.message) return;
    if (isJidGroup(jid) || isJidBroadcast(jid) || isJidNewsletter(jid)) return;
    if (this.processadas.has(m.key.id)) return;
    this.lembrar(this.processadas, m.key.id);
    if (ehMensagemDeSistema(m.message)) return;

    const telefone = await this.telefoneDe(jid, m.key.remoteJidAlt);

    if (m.key.fromMe) {
      if (this.enviadosPeloBot.has(m.key.id)) return;
      // Conversa "Você" (mensagem para si mesmo): é a dona usando o próprio celular do salão.
      if (this.ehMeuProprioChat(jid)) {
        return this.aoReceber({ telefone: this.meuNumero(), jid: this.meuJid(), texto: extrairTexto(m.message), deMimMesmo: true });
      }
      // Mensagem enviada do celular do salão por uma pessoa: pausa o bot nessa conversa.
      this.aoAtendimentoManual({ telefone, jid });
      return;
    }

    const texto = extrairTexto(m.message);
    const midia = temMidia(m.message);
    const encaminhar = midia
      ? async (numero) => {
          // Se a dona usa o próprio celular do salão, ela já vê o arquivo na conversa da cliente.
          if (soDigitos(numero) === this.meuNumero()) return false;
          const destino = await this.jidDoNumero(numero);
          const enviada = await this.sock.sendMessage(destino, { forward: m });
          if (enviada?.key?.id) this.lembrar(this.enviadosPeloBot, enviada.key.id);
          return true;
        }
      : undefined;
    try {
      await this.sock.readMessages([m.key]);
    } catch {
      /* não é essencial */
    }
    await this.aoReceber({ telefone, jid, nomePerfil: m.pushName ?? undefined, texto, midia, encaminhar });
  }

  meuJid() {
    return jidNormalizedUser(this.sock?.user?.id);
  }

  meuNumero() {
    return numeroDoJid(this.meuJid());
  }

  ehMeuProprioChat(jid) {
    const meus = [this.sock?.user?.id, this.sock?.user?.lid].filter(Boolean).map((j) => jidNormalizedUser(j));
    return meus.includes(jidNormalizedUser(jid));
  }

  lembrar(conjunto, id) {
    conjunto.add(id);
    if (conjunto.size > 5000) conjunto.delete(conjunto.values().next().value);
  }

  /** Descobre o JID real de um número (resolve a questão do 9º dígito). */
  async jidDoNumero(numero) {
    const digitos = soDigitos(numero);
    if (digitos === this.meuNumero()) return this.meuJid(); // conversa "Você"
    if (this.cacheJid.has(digitos)) return this.cacheJid.get(digitos);
    let jid = `${digitos}@s.whatsapp.net`;
    try {
      const [res] = (await this.sock.onWhatsApp(digitos)) ?? [];
      if (res?.exists && res.jid) jid = res.jid;
      else this.log.warn(`⚠️ O número ${digitos} não parece ter WhatsApp. Confira "numerosDona" no config.json.`);
    } catch {
      /* usa o formato padrão */
    }
    this.cacheJid.set(digitos, jid);
    return jid;
  }

  /** destino: JID (com @) ou número só com dígitos */
  async enviar(destino, texto) {
    if (!this.sock || !this.conectado) throw new Error('WhatsApp desconectado');
    const jid = String(destino).includes('@') ? destino : await this.jidDoNumero(destino);
    // pequena pausa com "digitando..." para parecer mais natural
    try {
      await this.sock.sendPresenceUpdate('composing', jid);
      await esperar(600 + Math.min(1800, texto.length * 8));
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch {
      /* não é essencial */
    }
    const enviada = await this.sock.sendMessage(jid, { text: texto });
    if (enviada?.key?.id) this.lembrar(this.enviadosPeloBot, enviada.key.id);
    return enviada;
  }
}
