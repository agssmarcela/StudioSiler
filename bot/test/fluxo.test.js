// Testes do fluxo completo:  npm test
// Relógio simulado começa na quarta 18/11/2026 às 10:00 (salão abre ter–sáb, 07:30–20:00, almoço 11:30–13:00).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Store } from '../src/store.js';
import { Bot } from '../src/bot.js';
import { localParaEpoch } from '../src/tempo.js';

const base = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const DONA = '5527999990000';
const ANA = '5527988881111';
const BIA = '5527988882222';
const jid = (n) => `${n}@s.whatsapp.net`;
const DESIGN = String(base.servicos.findIndex((s) => s.id === 'design-sobrancelhas') + 1);
const CLASSICO = String(base.servicos.findIndex((s) => s.id === 'volume-classico') + 1);

function montar(inicioLocal = ['2026-11-18', '10:00']) {
  const config = { ...base, numerosDona: [DONA], datasFechadas: [] };
  let agora = localParaEpoch(...inicioLocal, config.fusoHorario);
  const enviadas = [];
  const store = new Store(null);
  const bot = new Bot({
    config,
    store,
    agora: () => agora,
    enviar: async (destino, texto) => enviadas.push({ destino, texto }),
    log: { error: () => {} },
  });
  return {
    bot, store, enviadas,
    avancar: async (horas) => { agora += horas * 3600e3; await bot.verificar(); },
    cliente: async (tel, texto, extra = {}) => {
      enviadas.length = 0;
      await bot.receber({ telefone: tel, jid: jid(tel), texto, ...extra });
      return [...enviadas];
    },
    dona: async (texto) => { enviadas.length = 0; await bot.receber({ telefone: DONA, jid: jid(DONA), texto }); return [...enviadas]; },
  };
}

/** Agenda Design de sobrancelhas, 1º horário do dia escolhido (lista: 1=qua 18, 2=qui 19, 3=sex 20). */
async function agendar(h, tel, nome = 'ana souza', dia = '3') {
  await h.cliente(tel, 'oi');
  await h.cliente(tel, '1');
  const dias = await h.cliente(tel, DESIGN);
  assert.match(dias[0].texto, /Escolha o dia/);
  const horarios = await h.cliente(tel, dia);
  assert.match(horarios[0].texto, /Horários livres/);
  let r = await h.cliente(tel, '1');
  if (/qual é o seu nome/i.test(r[0].texto)) r = await h.cliente(tel, nome);
  assert.match(r[0].texto, /Confira seu pedido/);
  return h.cliente(tel, '1');
}

/** Mesma mensagem que o formulário do site monta (msgWA no index.html). */
const msgSite = ({ nome = 'Ana Souza', servico = 'Volume clássico · Boneca', quando = '20/11 às 07h30', sinal = 'R$ 42,00', ref = 'Ref: 2026-11-20 07:30 180min volume-classico' } = {}) =>
  `Oi, Julia! Fiz o agendamento no site e estou enviando o comprovante do sinal.\nNome: ${nome}\nServiço: ${servico}\nDia e horário: ${quando}\nSinal: ${sinal}${ref ? `\n${ref}` : ''}`;

// ------------------------------------------------------------------ fluxo pelo WhatsApp

test('cliente agenda, recebe dados do pix, dona recebe aviso e confirma', async () => {
  const h = montar();
  const r = await agendar(h, ANA);
  assert.equal(r.length, 2);
  assert.equal(r[0].destino, jid(ANA));
  assert.match(r[0].texto, /Pedido enviado/);
  assert.match(r[0].texto, /sinal é de \*R\$ 9,00\*/);
  assert.match(r[0].texto, /comprovante aqui/);
  assert.equal(r[1].destino, DONA);
  assert.match(r[1].texto, /Novo pedido de agendamento #1/);
  assert.match(r[1].texto, /Ana Souza/);

  const ag = h.store.agendamento(1);
  assert.equal(ag.status, 'pendente');
  assert.equal(ag.data, '2026-11-20');
  assert.equal(ag.hora, '07:30');

  const d = await h.dona('sim 1');
  assert.equal(d[0].destino, jid(ANA));
  assert.match(d[0].texto, /Agendamento confirmado/);
  assert.match(d[0].texto, /48h de antecedência/);
  assert.match(d[0].texto, /lembrete 24h antes/);
  assert.match(d[1].texto, /#1 confirmado/);
});

test('dona recusa com motivo e cliente é avisada e pode reagendar com 1', async () => {
  const h = montar();
  await agendar(h, ANA);
  const d = await h.dona('Não 1 estarei num curso');
  assert.match(d[0].texto, /não conseguimos confirmar/);
  assert.match(d[0].texto, /Motivo: estarei num curso/);
  assert.equal(h.store.agendamento(1).status, 'recusado');
  const r = await h.cliente(ANA, '1');
  assert.match(r[0].texto, /Qual serviço/);
});

test('"sim" sem número funciona quando só há um pedido pendente; com dois, pede o número', async () => {
  const h = montar();
  await agendar(h, ANA);
  await agendar(h, BIA, 'Bia');
  let d = await h.dona('sim');
  assert.match(d[0].texto, /mais de um pedido pendente/);
  d = await h.dona('SIM 2');
  assert.match(d[0].texto, /confirmado/);
  d = await h.dona('ok');
  assert.match(d.at(-1).texto, /#1 confirmado/);
});

test('horário reservado some da lista para outra cliente', async () => {
  const h = montar();
  await agendar(h, ANA); // sex 07:30–08:10
  await h.cliente(BIA, 'oi');
  await h.cliente(BIA, '1');
  await h.cliente(BIA, DESIGN);
  const r = await h.cliente(BIA, '3');
  assert.doesNotMatch(r[0].texto, /- 07:30/);
  assert.doesNotMatch(r[0].texto, /- 08:00/);
  assert.match(r[0].texto, /\*1\* - 08:30/);
});

test('confirmação feita a menos de 24h já conta como lembrete (não manda outro)', async () => {
  const h = montar();
  await agendar(h, ANA, 'Ana', '2'); // qui 07:30, faltam 21h30
  const d = await h.dona('sim 1');
  assert.doesNotMatch(d[0].texto, /lembrete 24h antes/);
  h.enviadas.length = 0;
  await h.avancar(1);
  assert.equal(h.enviadas.length, 0);
});

test('lembrete chega 24h antes e cliente responde 1 (confirma)', async () => {
  const h = montar();
  await agendar(h, ANA); // sex 07:30
  await h.dona('sim 1');
  h.enviadas.length = 0;

  await h.avancar(21); // qui 07:00 -> faltam 24h30
  assert.equal(h.enviadas.length, 0);
  await h.avancar(1); // qui 08:00 -> faltam 23h30
  assert.equal(h.enviadas.length, 1);
  assert.equal(h.enviadas[0].destino, jid(ANA));
  assert.match(h.enviadas[0].texto, /Lembrete/);
  assert.match(h.enviadas[0].texto, /amanhã/);

  const r = await h.cliente(ANA, '1');
  assert.match(r[0].texto, /presença confirmada/);
  assert.equal(r[1].destino, DONA);
  assert.match(r[1].texto, /confirmou presença/);
  assert.equal(h.store.agendamento(1).presenca, true);
});

test('cliente cancela pelo lembrete: horário liberado e aviso de que o sinal não volta (< 48h)', async () => {
  const h = montar();
  await agendar(h, ANA);
  await h.dona('sim 1');
  await h.avancar(22);
  const r = await h.cliente(ANA, '2');
  assert.match(r[0].texto, /cancelado/);
  assert.match(r[0].texto, /sinal não é devolvido/);
  assert.match(r[1].texto, /cancelou \(respondendo ao lembrete\)/);
  assert.equal(h.store.agendamento(1).status, 'cancelado');
});

test('sem resposta ao lembrete, dona é avisada 3h antes', async () => {
  const h = montar();
  await agendar(h, ANA);
  await h.dona('sim 1');
  await h.avancar(22); // lembrete (qui 08:00)
  h.enviadas.length = 0;
  await h.avancar(21); // sex 05:00, faltam 2h30
  assert.equal(h.enviadas.length, 1);
  assert.equal(h.enviadas[0].destino, DONA);
  assert.match(h.enviadas[0].texto, /ainda não confirmou/);
});

test('pedido sem resposta: dona é lembrada após 60min; expira se passar do horário', async () => {
  const h = montar();
  await agendar(h, ANA, 'Ana', '2'); // qui 07:30
  h.enviadas.length = 0;
  await h.avancar(1);
  assert.match(h.enviadas[0].texto, /ainda está aguardando sua resposta/);
  h.enviadas.length = 0;
  await h.avancar(23);
  assert.equal(h.store.agendamento(1).status, 'expirado');
  assert.ok(h.enviadas.some((e) => e.destino === jid(ANA) && /Não foi possível confirmar/.test(e.texto)));
});

test('cliente cancela pelo menu com antecedência (sem perder o sinal) e dona é avisada', async () => {
  const h = montar();
  await h.cliente(ANA, 'oi');
  await h.cliente(ANA, '1');
  await h.cliente(ANA, DESIGN);
  await h.cliente(ANA, '28/11');
  await h.cliente(ANA, '1');
  await h.cliente(ANA, 'Ana');
  await h.cliente(ANA, '1');
  await h.dona('sim 1');
  await h.cliente(ANA, 'menu');
  const lista = await h.cliente(ANA, '3');
  assert.match(lista[0].texto, /Qual agendamento você quer cancelar/);
  const r = await h.cliente(ANA, '1');
  assert.match(r[0].texto, /cancelei/);
  assert.doesNotMatch(r[0].texto, /não é devolvido/);
  assert.match(r[1].texto, /cancelou/);
});

test('comandos da dona: agenda, pendentes, fechar dia, cancelar', async () => {
  const h = montar();
  await agendar(h, ANA);
  let d = await h.dona('pendentes');
  assert.match(d[0].texto, /#1 — Ana Souza/);
  d = await h.dona('agenda amanhã');
  assert.match(d[0].texto, /Nenhum horário marcado/);
  d = await h.dona('agenda 20/11');
  assert.match(d[0].texto, /07:30 — Ana Souza/);
  d = await h.dona('fechar 20/11');
  assert.match(d[0].texto, /bloqueado/);
  assert.match(d[0].texto, /já existem 1/);
  d = await h.dona('cancelar 1 imprevisto');
  assert.match(d[0].texto, /cancelado pelo salão/);
  assert.match(d[0].texto, /Motivo: imprevisto/);
  await h.cliente(BIA, 'oi');
  await h.cliente(BIA, '1');
  const dias = await h.cliente(BIA, DESIGN);
  assert.doesNotMatch(dias[0].texto, /sex, 20\/11/);
  d = await h.dona('ajuda');
  assert.match(d[0].texto, /Comandos do bot/);
});

test('atendimento humano: bot fica em silêncio até "menu"', async () => {
  const h = montar();
  await h.cliente(ANA, 'oi');
  const r = await h.cliente(ANA, '5');
  assert.match(r[0].texto, /avisei a Julia/);
  assert.equal(r[1].destino, DONA);
  assert.equal((await h.cliente(ANA, 'tem horário sábado?')).length, 0);
  const m = await h.cliente(ANA, 'menu');
  assert.match(m[0].texto, /Como posso te ajudar/);
});

test('resposta manual pelo celular do salão pausa o bot', async () => {
  const h = montar();
  await h.cliente(ANA, 'oi');
  h.bot.pausarPorHumano({ telefone: ANA, jid: jid(ANA) });
  assert.equal((await h.cliente(ANA, '1')).length, 0);
});

test('aceita horário digitado, data digitada e emoji de número', async () => {
  const h = montar();
  await h.cliente(ANA, 'bom dia');
  await h.cliente(ANA, '1️⃣');
  await h.cliente(ANA, 'design de sobrancelhas');
  let r = await h.cliente(ANA, '24/11');
  assert.match(r[0].texto, /ter, 24\/11/);
  r = await h.cliente(ANA, '14h');
  assert.match(r[0].texto, /qual é o seu nome/i);
  r = await h.cliente(ANA, 'Ana');
  assert.match(r[0].texto, /ter, 24\/11 às 14:00/);
});

test('horários iguais aos do site: almoço, último horário, domingo e segunda fechados', async () => {
  const h = montar();
  await h.cliente(ANA, 'oi');
  await h.cliente(ANA, '1');
  await h.cliente(ANA, CLASSICO); // 3h
  const r = await h.cliente(ANA, '24/11');
  assert.match(r[0].texto, /- 08:30/); // termina 11:30, no limite do almoço
  assert.doesNotMatch(r[0].texto, /- 09:00/);
  assert.match(r[0].texto, /- 13:00/);
  assert.match(r[0].texto, /- 17:00/); // termina 20:00
  assert.doesNotMatch(r[0].texto, /- 17:30/);
  assert.match((await h.cliente(ANA, '22/11'))[0].texto, /Não temos horários livres/);
  assert.match((await h.cliente(ANA, '23/11'))[0].texto, /Não temos horários livres/);
});

test('mensagem do botão "Quero agendar" pula o menu (com e sem serviço)', async () => {
  const h = montar();
  let r = await h.cliente(ANA, 'Olá! Quero agendar um horário');
  assert.match(r[0].texto, /Vamos agendar/);
  assert.match(r[1].texto, /Qual serviço/);
  assert.match(r[1].texto, /\*Sobrancelhas\*/);
  r = await h.cliente(BIA, 'Olá! Quero agendar Lash lifting');
  assert.match(r[1].texto, /Lash lifting\*! 📅 Escolha o dia/);
});

// ------------------------------------------------------------------ integração com o site

test('site: pedido vira agendamento pendente e a dona recebe com o valor do sinal', async () => {
  const h = montar();
  const r = await h.cliente(ANA, msgSite());
  assert.equal(r[0].destino, jid(ANA));
  assert.match(r[0].texto, /Recebi seu agendamento do site/);
  assert.match(r[0].texto, /sex, 20\/11 às 07:30/);
  assert.equal(r[1].destino, DONA);
  assert.match(r[1].texto, /Novo agendamento pelo SITE #1/);
  assert.match(r[1].texto, /Volume clássico · Boneca/);
  assert.match(r[1].texto, /Sinal: R\$ 42,00/);
  const ag = h.store.agendamento(1);
  assert.equal(ag.origem, 'site');
  assert.equal(ag.duracao, 180);
  assert.equal(ag.servicoId, 'volume-classico');

  // o horário do site agora bloqueia a agenda do bot
  await h.cliente(BIA, 'oi');
  await h.cliente(BIA, '1');
  await h.cliente(BIA, DESIGN);
  const horarios = await h.cliente(BIA, '20/11');
  assert.match(horarios[0].texto, /\*1\* - 10:30/);

  const d = await h.dona('sim 1');
  assert.match(d[0].texto, /Agendamento confirmado/);
});

test('site: comprovante (foto) é encaminhado para a dona', async () => {
  const h = montar();
  await h.cliente(ANA, msgSite());
  const encaminhados = [];
  const r = await h.cliente(ANA, null, { midia: true, encaminhar: async (n) => { encaminhados.push(n); return true; } });
  assert.deepEqual(encaminhados, [DONA]);
  assert.equal(r[0].destino, DONA);
  assert.match(r[0].texto, /enviou um arquivo .* pedido \*#1\* — encaminhei logo acima/);
  assert.equal(r[1].destino, jid(ANA));
  assert.match(r[1].texto, /Recebi! 📎/);
});

test('foto sem pedido em aberto recebe a mensagem padrão', async () => {
  const h = montar();
  const r = await h.cliente(ANA, null, { midia: true, encaminhar: async () => true });
  assert.match(r[0].texto, /só entendo mensagens de texto/);
});

test('site: mensagem repetida não duplica o agendamento', async () => {
  const h = montar();
  await h.cliente(ANA, msgSite());
  const r = await h.cliente(ANA, msgSite());
  assert.equal(r.length, 1);
  assert.match(r[0].texto, /Já recebi esse agendamento/);
  assert.equal(h.store.agendamentos().length, 1);
});

test('site: horário já ocupado na agenda real -> cliente escolhe outro e dona é avisada', async () => {
  const h = montar();
  await h.cliente(ANA, msgSite());
  const r = await h.cliente(BIA, msgSite({ nome: 'Bia Lima', ref: 'Ref: 2026-11-20 08:00 180min volume-brasileiro', servico: 'Volume brasileiro' }));
  assert.match(r[0].texto, /já está ocupado/);
  assert.equal(r[1].destino, DONA);
  assert.match(r[1].texto, /Bia Lima .* horário já estava ocupado/);
  assert.match(r[2].texto, /Volume brasileiro\*! 📅 Escolha o dia/);
  assert.equal(h.store.agendamentos().length, 1);
});

test('site: sem a linha Ref (versão antiga do site) o bot entende pelas outras linhas', async () => {
  const h = montar();
  const r = await h.cliente(ANA, msgSite({ ref: null, servico: 'Design com henna', quando: '21/11 às 13h' }));
  assert.match(r[0].texto, /Recebi seu agendamento do site/);
  const ag = h.store.agendamento(1);
  assert.equal(ag.data, '2026-11-21');
  assert.equal(ag.hora, '13:00');
  assert.equal(ag.duracao, 50);
});

test('site: mensagem ilegível vai para a dona', async () => {
  const h = montar();
  const r = await h.cliente(ANA, 'Oi, Julia! Fiz o agendamento no site e estou enviando o comprovante do sinal.');
  assert.match(r[0].texto, /não consegui ler/);
  assert.equal(r[1].destino, DONA);
  assert.match(r[1].texto, /não consegui ler/);
});

test('site: link "outro horário" vai direto para a Julia', async () => {
  const h = montar();
  const r = await h.cliente(ANA, 'Oi, Julia! Preciso de um horário fora dos que aparecem no site.');
  assert.match(r[0].texto, /avisei a Julia/);
  assert.equal(r[1].destino, DONA);
});

test('dona no mesmo celular do salão: conversa "Você" aceita comandos', async () => {
  const h = montar();
  await agendar(h, ANA);
  h.enviadas.length = 0;
  await h.bot.receber({ telefone: DONA, jid: jid(DONA), texto: 'sim 1', deMimMesmo: true });
  assert.match(h.enviadas.at(-1).texto, /#1 confirmado/);
  h.enviadas.length = 0;
  await h.bot.receber({ telefone: '5527911112222', jid: 'x@s.whatsapp.net', texto: 'oi', deMimMesmo: true });
  assert.equal(h.enviadas.length, 0);
});
