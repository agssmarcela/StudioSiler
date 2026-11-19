// Leitura da mensagem que o formulário de agendamento do site manda pelo WhatsApp:
//
//   Oi, Julia! Fiz o agendamento no site e estou enviando o comprovante do sinal.
//   Nome: Ana Souza
//   Serviço: Volume clássico · Boneca
//   Dia e horário: 20/11 às 07h30
//   Sinal: R$ 42,00
//   Ref: 2026-11-20 07:30 180min volume-classico
//
// A linha "Ref" é para o bot (data completa, duração e id do serviço). Sem ela, o bot tenta
// entender pelas outras linhas.

import { interpretarData, interpretarHorario } from './tempo.js';
import { normalizar } from './texto.js';

export const ehMensagemDoSite = (texto) => /fiz o agendamento no site/.test(normalizar(texto));

export function lerPedidoDoSite(texto, { hoje, servicos }) {
  if (!ehMensagemDoSite(texto)) return null;
  const linha = (rotulo) => String(texto).match(new RegExp(`^\\s*${rotulo}\\s*:\\s*(.+?)\\s*$`, 'im'))?.[1];

  const nome = linha('Nome');
  const servicoNome = linha('Servi[cç]o');
  const quando = linha('Dia e hor[aá]rio');
  const sinalTxt = linha('Sinal');
  const ref = String(texto).match(/Ref:\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(\d+)\s*min(?:\s+([\w-]+))?/i);

  const pedido = {
    nome: nome || null,
    servicoNome: servicoNome || null,
    sinal: sinalTxt ? Number(sinalTxt.replace(/[^\d,]/g, '').replace(',', '.')) || null : null,
    data: null,
    hora: null,
    duracao: null,
    servicoId: null,
  };

  if (ref) {
    pedido.data = ref[1];
    pedido.hora = ref[2].padStart(5, '0');
    pedido.duracao = Number(ref[3]);
    pedido.servicoId = ref[4] ?? null;
  } else if (quando) {
    pedido.data = interpretarData(quando, hoje);
    pedido.hora = interpretarHorario(quando.split(/\s+[àa]s\s+/i)[1] ?? quando);
  }

  // Serviço do config: pelo id da Ref ou pelo começo do nome ("Volume clássico · Boneca").
  const sv =
    servicos.find((s) => s.id === pedido.servicoId) ??
    servicos
      .filter((s) => pedido.servicoNome && normalizar(pedido.servicoNome).startsWith(normalizar(s.nome).replace(/\s*\(.*\)$/, '')))
      .sort((a, b) => b.nome.length - a.nome.length)[0];
  if (sv) {
    pedido.servicoId = sv.id;
    pedido.duracao ??= sv.duracao;
    pedido.rotulo = sv.rotulo;
    pedido.preco = sv.preco;
  }
  pedido.servicoNome ??= sv?.nome ?? null;
  pedido.completo = !!(pedido.data && pedido.hora && pedido.duracao && pedido.servicoNome);
  return pedido;
}
