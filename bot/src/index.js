// Inicia o bot conectado ao WhatsApp do salão.
//   npm start                       -> login por QR code
//   NUMERO_SALAO=5527999999999 npm start  -> login por código de pareamento

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { Bot } from './bot.js';
import { WhatsApp } from './whatsapp.js';
import { validarConfig } from './validar.js';

const config = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
validarConfig(config);

const log = {
  info: (...a) => console.log(new Date().toLocaleString('pt-BR'), ...a),
  warn: (...a) => console.warn(new Date().toLocaleString('pt-BR'), ...a),
  error: (...a) => console.error(new Date().toLocaleString('pt-BR'), ...a),
};

const store = new Store(fileURLToPath(new URL('../data/db.json', import.meta.url)));
const wa = new WhatsApp({
  pastaAuth: fileURLToPath(new URL('../auth', import.meta.url)),
  numeroSalao: process.env.NUMERO_SALAO || null,
  log,
});
const bot = new Bot({ config, store, enviar: (destino, texto) => wa.enviar(destino, texto), log });

wa.aoReceber = (msg) => bot.receber(msg);
wa.aoAtendimentoManual = (contato) => bot.pausarPorHumano(contato);

await wa.iniciar();
log.info(`🤖 Bot do ${config.salao} iniciado.`);

// Lembretes e avisos: verifica a cada minuto (só quando o WhatsApp está conectado).
let rodando = false;
setInterval(async () => {
  if (!wa.conectado || rodando) return;
  rodando = true;
  try {
    await bot.verificar();
  } catch (e) {
    log.error('Erro na verificação periódica:', e);
  } finally {
    rodando = false;
  }
}, 60_000);

process.on('unhandledRejection', (e) => log.error('Erro não tratado:', e));
