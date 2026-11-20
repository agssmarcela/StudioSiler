// Confere o config.json antes de iniciar, com mensagens de erro claras.

import { soDigitos } from './telefone.js';

export function validarConfig(c) {
  const erros = [];
  if (!Array.isArray(c.numerosDona) || !c.numerosDona.length) erros.push('"numerosDona" precisa ter pelo menos um número.');
  for (const n of c.numerosDona ?? []) {
    const d = soDigitos(n);
    if (d.length < 12) erros.push(`Número "${n}" inválido: use DDI + DDD + número, ex: 5527999998888.`);
    if (/^55\d{2}9{9}$/.test(d)) erros.push(`Troque o número de exemplo "${n}" pelo número da dona do salão.`);
  }
  if (!Array.isArray(c.servicos) || !c.servicos.length) erros.push('Cadastre pelo menos um serviço em "servicos".');
  const ids = new Set();
  for (const s of c.servicos ?? []) {
    if (!s.id || !s.nome || !s.duracao) erros.push(`Serviço incompleto: ${JSON.stringify(s)} (precisa de id, nome e duracao).`);
    if (ids.has(s.id)) erros.push(`Serviço com id repetido: "${s.id}".`);
    ids.add(s.id);
  }
  for (const [dia, h] of Object.entries(c.horarios ?? {})) {
    if (h !== null && !(Array.isArray(h) && h.length === 2 && h.every((x) => /^\d{2}:\d{2}$/.test(x)))) {
      erros.push(`Horário de "${dia}" inválido: use ["09:00", "19:00"] ou null para fechado.`);
    }
  }
  if (erros.length) {
    console.error('\n❌ Corrija o config.json:\n - ' + erros.join('\n - ') + '\n');
    process.exit(1);
  }
}
