// Simulador no terminal: teste o bot sem WhatsApp.  ->  npm run simular
//
//   oi                 mensagem da cliente 1
//   c2: oi             mensagem da cliente 2
//   d: sim 1           mensagem da dona
//   +23h  +30min  +1d  avança o relógio e roda a verificação de lembretes
//   /agora             mostra o horário simulado
//   /sair              encerra

import fs from 'node:fs';
import readline from 'node:readline';
import { Store } from './store.js';
import { Bot } from './bot.js';
import { partes } from './tempo.js';

const config = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const DONA = config.numerosDona[0];
const CLIENTES = { c1: '5527988881111', c2: '5527988882222', c3: '5527988883333' };

let relogio = Date.now();
const nomes = { [DONA]: 'DONA' };
for (const [k, v] of Object.entries(CLIENTES)) nomes[`${v}@s.whatsapp.net`] = `CLIENTE ${k.slice(1)}`;
nomes[`${DONA}@s.whatsapp.net`] = 'DONA';

const cor = { cliente: '\x1b[36m', dona: '\x1b[35m', reset: '\x1b[0m', cinza: '\x1b[90m' };
const bot = new Bot({
  config,
  store: new Store(null),
  agora: () => relogio,
  enviar: async (destino, texto) => {
    const quem = nomes[destino] ?? destino;
    const c = quem === 'DONA' ? cor.dona : cor.cliente;
    console.log(`\n${c}📤 para ${quem}:${cor.reset}\n${texto.replace(/^/gm, '   ')}`);
  },
});

const agoraTexto = () => {
  const p = partes(relogio, config.fusoHorario);
  return `${p.data.split('-').reverse().join('/')} ${p.horario}`;
};

console.log(`${cor.cinza}Simulador do bot ${config.salao} — horário simulado: ${agoraTexto()}`);
console.log('Digite mensagens da cliente (ou "c2: ...", "d: ..." para a dona). "+23h" avança o relógio. /sair encerra.' + cor.reset);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '\n> ' });
rl.prompt();
let fila = Promise.resolve();
rl.on('line', (linha) => { fila = fila.then(() => tratar(linha)); });
rl.on('close', () => fila.then(() => process.exit(0)));

async function tratar(linha) {
  const l = linha.trim();
  if (!l) return rl.prompt();
  if (l === '/sair') return process.exit(0);
  if (l === '/agora') {
    console.log(agoraTexto());
    return rl.prompt();
  }
  const av = l.match(/^\+(\d+)\s*(min|h|d)$/i);
  if (av) {
    const mult = { min: 60e3, h: 3600e3, d: 86400e3 }[av[2].toLowerCase()];
    relogio += Number(av[1]) * mult;
    console.log(`${cor.cinza}⏩ Agora são ${agoraTexto()}${cor.reset}`);
    await bot.verificar();
    return rl.prompt();
  }
  const m = l.match(/^(d|c\d):\s*(.*)$/i);
  const quem = m ? m[1].toLowerCase() : 'c1';
  const texto = m ? m[2] : l;
  if (quem === 'd') await bot.receber({ telefone: DONA, jid: `${DONA}@s.whatsapp.net`, texto });
  else {
    const tel = CLIENTES[quem] ?? CLIENTES.c1;
    await bot.receber({ telefone: tel, jid: `${tel}@s.whatsapp.net`, nomePerfil: 'Cliente', texto });
  }
  rl.prompt();
}
