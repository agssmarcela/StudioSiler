// Todos os textos que o bot envia ficam aqui, para facilitar a personalização.
// *texto* = negrito no WhatsApp, _texto_ = itálico.

import { dataCurta, duracaoTexto } from './tempo.js';
import { telefoneBonito, soDigitos } from './telefone.js';

export const reais = (v) => (v == null ? '' : `R$ ${Number(v).toFixed(2).replace('.', ',')}`);

export const STATUS_TEXTO = {
  pendente: '⏳ aguardando confirmação',
  confirmado: '✅ confirmado',
  recusado: '❌ não confirmado',
  cancelado: '🚫 cancelado',
  expirado: '⌛ expirado',
  concluido: '✔️ concluído',
};

export const criarMensagens = (c) => {
  const dona = c.nomeDona ? `a ${c.nomeDona}` : 'a equipe';
  const aDona = c.nomeDona ? `a ${c.nomeDona}` : 'o salão';
  const tempo = (s) => s.rotulo ?? duracaoTexto(s.duracao);

  /** Lista numerada agrupada por categoria (a numeração é contínua). */
  const listaServicos = (lista) => {
    let cat = null;
    return lista
      .map((s, i) => {
        const titulo = s.categoria && s.categoria !== cat ? `${cat === null ? '' : '\n'}*${(cat = s.categoria)}*\n` : '';
        return `${titulo}*${i + 1}* - ${s.nome} (${tempo(s)}${s.preco != null ? ` • ${reais(s.preco)}` : ''})`;
      })
      .join('\n');
  };

  const pixTexto = (sinal) =>
    c.pix?.chave
      ? `Para garantir o horário, o sinal é de *${reais(sinal)}* (${c.sinalPercentual}%), pelo pix:\n` +
        `🔑 ${c.pix.chave}\n👤 ${c.pix.nome}\n\nDepois é só mandar o *comprovante aqui* nesta conversa. `
      : '';

  return {
    // ---------------- cliente ----------------
    menu: (nome) =>
      `Olá${nome ? `, ${nome}` : ''}! 💜 Boas-vindas ao *${c.salao}*${c.slogan ? ` — ${c.slogan}` : ''}.\n\n` +
      'Como posso te ajudar? Responda com o número:\n\n' +
      '*1* - Agendar horário\n' +
      '*2* - Meus agendamentos\n' +
      '*3* - Cancelar agendamento\n' +
      '*4* - Serviços e valores\n' +
      `*5* - Falar com ${c.nomeDona ? `a ${c.nomeDona}` : 'a equipe'}`,

    saudacaoAgendamento: (nome) =>
      `Olá${nome ? `, ${nome}` : ''}! 💜 Que bom te ver por aqui. Vamos agendar seu horário no *${c.salao}*.`,

    menuCurto: () =>
      'Não entendi 🤔 Responda com o número da opção:\n\n' +
      '*1* - Agendar  •  *2* - Meus agendamentos  •  *3* - Cancelar\n' +
      `*4* - Serviços e valores  •  *5* - Falar com ${c.nomeDona ? `a ${c.nomeDona}` : 'a equipe'}`,

    servicos: (lista) => `Qual serviço você deseja? ✨\n\n${listaServicos(lista)}\n\n_0 - voltar ao menu_`,

    tabelaServicos: (lista) =>
      `💅 *Serviços do ${c.salao}*\n\n${listaServicos(lista).replace(/\*\d+\* - /g, '• ')}` +
      (c.sinalPercentual ? `\n\nSinal de ${c.sinalPercentual}% pelo pix para garantir o horário (abatido no pagamento final).` : '') +
      (c.endereco ? `\n📍 ${c.endereco}` : '') +
      '\n\nPara agendar, responda *1*.',

    dias: (servico, dias) =>
      `Ótimo, *${servico.nome}*! 📅 Escolha o dia:\n\n` +
      dias.map((d, i) => `*${i + 1}* - ${dataCurta(d)}`).join('\n') +
      '\n\nOu digite outra data (ex: 28/11).\n_0 - voltar ao menu_',

    semDias: () =>
      'Poxa, não encontrei horários livres nos próximos dias para esse serviço 😕\n' +
      `Responda *5* para falar com ${dona} ou *0* para voltar ao menu.`,

    dataSemHorario: (data) =>
      `Não temos horários livres em ${dataCurta(data)} 😕 Escolha um dos dias da lista ou digite outra data.`,

    horarios: (data, horarios) =>
      `Horários livres em *${dataCurta(data)}* 🕐\n\n` +
      horarios.map((h, i) => `*${i + 1}* - ${h}`).join('\n') +
      '\n\nResponda com o número (ou digite o horário, ex: 14h).\n_0 - voltar ao menu_',

    horarioOcupou: () => 'Ops, esse horário acabou de ser reservado por outra pessoa 😕 Vamos escolher outro:',

    pedirNome: () => 'Para finalizar, qual é o seu nome? 😊',

    nomeInvalido: () => 'Pode me dizer seu nome, por favor? (só o nome mesmo 😊)',

    resumo: (d) =>
      '📝 *Confira seu pedido:*\n\n' +
      `👤 ${d.nome}\n` +
      `💅 ${d.servicoNome} (${d.rotulo ?? duracaoTexto(d.duracao)})\n` +
      `📅 ${dataCurta(d.data)} às ${d.hora}\n` +
      (d.preco != null ? `💰 ${reais(d.preco)}\n` : '') +
      '\n*1* - Confirmar pedido\n*2* - Escolher outro dia/horário\n*0* - Cancelar',

    pedidoEnviado: (ag) =>
      `Pedido enviado! 💜\n\n${pixTexto(ag.sinal)}Assim que ${aDona} confirmar, eu te aviso por aqui.`,

    pedidoSiteRecebido: (ag) =>
      `Recebi seu agendamento do site! 💜\n\n💅 ${ag.servicoNome}\n📅 ${dataCurta(ag.data)} às ${ag.hora}\n\n` +
      `Se ainda não mandou, envie aqui o *comprovante do pix* do sinal${ag.sinal ? ` (${reais(ag.sinal)})` : ''}. ` +
      `Assim que ${aDona} conferir, eu te aviso por aqui.`,

    pedidoSiteDuplicado: (ag) =>
      `Já recebi esse agendamento (${dataCurta(ag.data)} às ${ag.hora}) e ele está ${STATUS_TEXTO[ag.status]}. 💜 ` +
      'Se ainda não mandou o comprovante do pix, pode enviar aqui.',

    pedidoSiteOcupado: (data, hora) =>
      `Poxa, o horário de ${dataCurta(data)} às ${hora} já está ocupado na agenda 😕 ` +
      '(se você já pagou o sinal, fica tranquila: ele vale para o novo horário).\nVamos escolher outro?',

    pedidoSiteIlegivel: () =>
      `Recebi sua mensagem do site, mas não consegui ler todos os dados 🙈 Já avisei ${dona}, ela te responde por aqui.`,

    comprovanteRecebido: () =>
      `Recebi! 📎 Já encaminhei para ${dona} conferir. Assim que ela confirmar, te aviso por aqui 💜`,

    confirmadoCliente: (ag, comLembrete) =>
      `✅ *Agendamento confirmado!*\n\n💅 ${ag.servicoNome}\n📅 ${dataCurta(ag.data)} às ${ag.hora}\n` +
      (c.endereco ? `📍 ${c.endereco}\n` : '') +
      (c.horasCancelamentoSemPerda ? `\nSe precisar desmarcar, avise com ${c.horasCancelamentoSemPerda}h de antecedência.` : '') +
      (comLembrete ? '\nVou te mandar um lembrete 24h antes. Até lá! 💜' : '\nTe esperamos! 💜'),

    recusadoCliente: (ag, motivo) =>
      `😔 Infelizmente não conseguimos confirmar *${ag.servicoNome}* em ${dataCurta(ag.data)} às ${ag.hora}.` +
      (motivo ? `\nMotivo: ${motivo}` : '') +
      '\n\nQuer escolher outro horário? Responda *1*.',

    canceladoPeloSalao: (ag, motivo) =>
      `⚠️ Seu agendamento de *${ag.servicoNome}* em ${dataCurta(ag.data)} às ${ag.hora} precisou ser cancelado pelo salão.` +
      (motivo ? `\nMotivo: ${motivo}` : '') +
      '\n\nDesculpe o transtorno! Para remarcar, responda *1*.',

    expiradoCliente: (ag) =>
      `⌛ Não foi possível confirmar a tempo seu pedido de ${ag.servicoNome} (${dataCurta(ag.data)} às ${ag.hora}). ` +
      `Responda *1* para escolher outro horário ou *5* para falar com ${dona}.`,

    meusAgendamentos: (lista) =>
      lista.length
        ? '📋 *Seus próximos agendamentos:*\n\n' +
          lista.map((a) => `• ${dataCurta(a.data)} às ${a.hora} — ${a.servicoNome}\n   ${STATUS_TEXTO[a.status]}`).join('\n') +
          '\n\n_0 - menu_'
        : 'Você não tem agendamentos futuros. Para agendar, responda *1*.',

    escolherCancelar: (lista) =>
      'Qual agendamento você quer cancelar?\n\n' +
      lista.map((a, i) => `*${i + 1}* - ${dataCurta(a.data)} às ${a.hora} — ${a.servicoNome}`).join('\n') +
      (c.horasCancelamentoSemPerda
        ? `\n\n_Lembrando: cancelamentos com menos de ${c.horasCancelamentoSemPerda}h de antecedência não têm o sinal devolvido._`
        : '') +
      '\n_0 - voltar ao menu_',

    nadaParaCancelar: () => 'Você não tem agendamentos para cancelar. Para agendar, responda *1*.',

    canceladoCliente: (ag, perdeSinal) =>
      `Pronto, cancelei seu agendamento de ${ag.servicoNome} em ${dataCurta(ag.data)} às ${ag.hora}.` +
      (perdeSinal ? ` Como faltavam menos de ${c.horasCancelamentoSemPerda}h, o sinal não é devolvido.` : '') +
      ' Quando quiser remarcar, é só responder *1*. 💜',

    humano: () =>
      `Certo! Já avisei ${dona}, em breve ela te responde por aqui. 💜\n` +
      '_(Para voltar ao atendimento automático, digite *menu*.)_',

    lembrete: (ag, quando) =>
      `⏰ *Lembrete ${c.salao}*\n\n` +
      `Oi${ag.nome ? `, ${ag.nome}` : ''}! Passando para lembrar do seu horário ${quando}:\n\n` +
      `💅 ${ag.servicoNome}\n📅 ${dataCurta(ag.data)} às ${ag.hora}\n` +
      (c.endereco ? `📍 ${c.endereco}\n` : '') +
      '\nVocê confirma sua presença?\n*1* - Sim, confirmo ✅\n*2* - Não poderei ir, quero cancelar',

    lembreteDeNovo: () => 'Me confirma sua presença, por favor: *1* - confirmo ✅  •  *2* - quero cancelar\n_0 - ver o menu_',

    presencaConfirmada: () => 'Perfeito, presença confirmada! Te esperamos 💜',

    canceladoPeloLembrete: (perdeSinal) =>
      'Tudo bem, seu horário foi cancelado.' +
      (perdeSinal ? ` Como faltavam menos de ${c.horasCancelamentoSemPerda}h, o sinal não é devolvido.` : '') +
      ' Quando quiser remarcar, é só responder *1*. 💜',

    soTexto: () =>
      `Por enquanto eu só entendo mensagens de texto 🙈 Responda com o número da opção, ou *5* para falar com ${dona}.`,

    // ---------------- dona ----------------
    novoPedido: (ag) =>
      `${ag.origem === 'site' ? '🌐 *Novo agendamento pelo SITE' : '📅 *Novo pedido de agendamento'} #${ag.id}*\n\n` +
      `👤 ${ag.nome} — ${telefoneBonito(ag.telefone)}\n` +
      `💅 ${ag.servicoNome} (${ag.rotulo ?? duracaoTexto(ag.duracao)})\n` +
      `📅 ${dataCurta(ag.data)} às ${ag.hora}\n` +
      (ag.sinal ? `💰 Sinal: ${reais(ag.sinal)} — confira o comprovante antes de confirmar\n` : '') +
      `\nResponda:\n✅ *SIM ${ag.id}* para confirmar\n❌ *NAO ${ag.id}* para recusar\n` +
      `_(pode incluir o motivo: NAO ${ag.id} esse horário já está ocupado)_`,

    donaComprovante: (ag, encaminhado) =>
      `📎 ${ag.nome} enviou um arquivo (provavelmente o comprovante) para o pedido *#${ag.id}*` +
      `${encaminhado ? ' — encaminhei logo acima.' : '. Veja na conversa dela.'}\n` +
      `${ag.servicoNome}, ${dataCurta(ag.data)} às ${ag.hora}. Responda *SIM ${ag.id}* ou *NAO ${ag.id}*.`,

    donaPedidoSiteIlegivel: (telefone, texto) =>
      `⚠️ Chegou uma mensagem do site que eu não consegui ler (${telefoneBonito(telefone)}):\n\n${texto}\n\n` +
      `Responda a cliente direto: wa.me/${soDigitos(telefone)}`,

    donaPedidoSiteOcupado: (nome, telefone, data, hora) =>
      `⚠️ ${nome} (${telefoneBonito(telefone)}) mandou um agendamento do site para ${dataCurta(data)} às ${hora}, ` +
      'mas o horário já estava ocupado. Pedi para ela escolher outro. Se ela já pagou o sinal, fique de olho.',

    pedidoAindaPendente: (ag) =>
      `⏳ O pedido *#${ag.id}* ainda está aguardando sua resposta:\n` +
      `${ag.nome} — ${ag.servicoNome}, ${dataCurta(ag.data)} às ${ag.hora}\n\n` +
      `Responda *SIM ${ag.id}* ou *NAO ${ag.id}*.`,

    donaConfirmou: (ag) => `✅ #${ag.id} confirmado. Já avisei ${ag.nome}.`,
    donaRecusou: (ag) => `❌ #${ag.id} recusado. Já avisei ${ag.nome}.`,
    donaCancelou: (ag) => `🚫 #${ag.id} cancelado. Já avisei ${ag.nome}.`,

    clienteConfirmouPresenca: (ag) =>
      `👍 ${ag.nome} confirmou presença — ${ag.servicoNome}, ${dataCurta(ag.data)} às ${ag.hora} (#${ag.id}).`,

    clienteCancelou: (ag, origem, perdeSinal) =>
      `🚫 ${ag.nome} cancelou${origem === 'lembrete' ? ' (respondendo ao lembrete)' : ''}: ` +
      `${ag.servicoNome}, ${dataCurta(ag.data)} às ${ag.hora} (#${ag.id}). O horário foi liberado.` +
      (perdeSinal ? `\n(menos de ${c.horasCancelamentoSemPerda}h de antecedência: avisei que o sinal não é devolvido)` : ''),

    semConfirmacao: (ag) =>
      `⚠️ ${ag.nome} ainda não confirmou presença para ${dataCurta(ag.data)} às ${ag.hora} — ${ag.servicoNome} (#${ag.id}).\n` +
      `Contato: wa.me/${soDigitos(ag.telefone)}`,

    pedidoExpirou: (ag) =>
      `⌛ O pedido #${ag.id} (${ag.nome}, ${dataCurta(ag.data)} às ${ag.hora}) expirou sem resposta. Avisei a cliente.`,

    pediuHumano: (nome, telefone) =>
      `💬 ${nome || 'Uma cliente'} (${telefoneBonito(telefone)}) quer falar com você.\n` +
      `Responda pelo WhatsApp do salão: wa.me/${soDigitos(telefone)}`,

    ajudaDona: () =>
      '🤖 *Comandos do bot*\n\n' +
      '*SIM 12* — confirmar pedido #12\n' +
      '*NAO 12 motivo* — recusar pedido #12\n' +
      '*PENDENTES* — pedidos aguardando resposta\n' +
      '*AGENDA* — agenda de hoje (ou *AGENDA AMANHA*, *AGENDA 28/11*)\n' +
      '*CANCELAR 12 motivo* — cancelar um agendamento e avisar a cliente\n' +
      '*FECHAR 24/12* — bloquear um dia inteiro\n' +
      '*ABRIR 24/12* — desbloquear um dia',

    qualPedido: (lista) =>
      'Há mais de um pedido pendente. Responda com o número, ex: *SIM 12*\n\n' +
      lista.map((a) => `#${a.id} — ${a.nome}, ${a.servicoNome}, ${dataCurta(a.data)} às ${a.hora}`).join('\n'),

    pedidoNaoEncontrado: (id) => `Não encontrei o agendamento${id ? ` #${id}` : ''}. Digite *PENDENTES* ou *AGENDA*.`,

    pedidoJaDecidido: (ag) => `O agendamento #${ag.id} já está ${STATUS_TEXTO[ag.status]}.`,

    semPendentes: () => 'Nenhum pedido aguardando resposta. 🎉',

    pendentes: (lista) =>
      '⏳ *Pedidos aguardando resposta:*\n\n' +
      lista.map((a) => `#${a.id} — ${a.nome}, ${a.servicoNome}, ${dataCurta(a.data)} às ${a.hora}`).join('\n') +
      '\n\nResponda *SIM nº* ou *NAO nº*.',

    agenda: (data, lista, fechada) =>
      `📒 *Agenda de ${dataCurta(data)}*${fechada ? ' (dia fechado)' : ''}\n\n` +
      (lista.length
        ? lista
            .map((a) => {
              const marca = a.status === 'pendente' ? '⏳' : a.presenca ? '👍' : '✅';
              return `${marca} ${a.hora} — ${a.nome} — ${a.servicoNome} (#${a.id})`;
            })
            .join('\n') +
          '\n\n⏳ pendente  ✅ confirmado  👍 presença confirmada'
        : 'Nenhum horário marcado.'),

    diaFechado: (data, afetados) =>
      `🔒 ${dataCurta(data)} bloqueado para novos agendamentos.` +
      (afetados.length
        ? `\n\nAtenção: já existem ${afetados.length} agendamento(s) nesse dia: ` +
          afetados.map((a) => `#${a.id} ${a.hora} ${a.nome}`).join(', ') +
          '. Use *CANCELAR nº motivo* se precisar desmarcar.'
        : ''),

    diaAberto: (data) => `🔓 ${dataCurta(data)} liberado para agendamentos.`,

    dataInvalida: () => 'Não entendi a data. Use o formato dia/mês, ex: *FECHAR 24/12*.',
  };
};
