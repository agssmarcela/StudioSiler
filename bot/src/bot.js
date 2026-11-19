// Núcleo do bot: conversa com clientes, comandos da dona e rotina de lembretes.
// Não depende do WhatsApp: recebe mensagens por receber() e envia pela função enviar().

import { criarMensagens } from './mensagens.js';
import { horariosLivres, diasDisponiveis, dataFechada, STATUS_ATIVOS } from './agenda.js';
import { partes, localParaEpoch, somarDias, interpretarData, interpretarHorario } from './tempo.js';
import { chaveTelefone, mesmoTelefone } from './telefone.js';
import { normalizar } from './texto.js';
import { lerPedidoDoSite } from './site.js';

export { normalizar };

const H = 3600e3;
const MIN = 60e3;

/** Extrai a opção numérica de respostas como "2", "2)", "opção 2", "*2*". */
function opcao(t) {
  const m = t.replace(/[*_]/g, '').match(/^(?:opcao|op|numero|n)?\s*(\d{1,2})\s*[).\-!]*$/);
  return m ? Number(m[1]) : null;
}

const temPalavra = (t, ...palavras) => palavras.some((p) => new RegExp(`\\b${p}`).test(t));

export class Bot {
  constructor({ config, store, enviar, agora = () => Date.now(), log = console }) {
    this.c = config;
    this.store = store;
    this.enviarFn = enviar;
    this.agora = agora;
    this.log = log;
    this.M = criarMensagens(config);
  }

  async enviar(destino, texto) {
    try {
      await this.enviarFn(destino, texto);
    } catch (e) {
      this.log.error?.(`Falha ao enviar para ${destino}: ${e.message}`);
    }
  }

  async avisarDona(texto) {
    for (const numero of this.c.numerosDona) await this.enviar(numero, texto);
  }

  ehDona(telefone) {
    return !!telefone && this.c.numerosDona.some((n) => mesmoTelefone(n, telefone));
  }

  hoje() {
    return partes(this.agora(), this.c.fusoHorario).data;
  }

  /**
   * Ponto de entrada de toda mensagem recebida.
   * @param {{telefone?: string, jid: string, nomePerfil?: string, texto?: string|null}} msg
   *   telefone: número em dígitos (pode faltar); jid: endereço para responder; texto: null se não for texto
   *   midia: true se veio foto/PDF/arquivo; encaminhar(numero): reenvia essa mídia para outro número (retorna true/false)
   */
  async receber(msg) {
    if (this.ehDona(msg.telefone)) return this.receberDona(msg);
    if (msg.deMimMesmo) return; // conversa "Você" do celular do salão, mas o número não é de dona
    return this.receberCliente(msg);
  }

  /** Chamado quando alguém da equipe responde manualmente um cliente pelo celular do salão. */
  pausarPorHumano({ telefone, jid }) {
    const chave = telefone ? chaveTelefone(telefone) : jid;
    const s = this.store.sessao(chave);
    this.store.salvarSessao(chave, {
      ...s,
      jid: s.jid ?? jid,
      estado: 'humano',
      dados: { ate: this.agora() + this.c.minutosAtendimentoHumano * MIN },
      atualizadoEm: this.agora(),
    });
  }

  // =====================================================================
  // CLIENTE
  // =====================================================================

  async receberCliente({ telefone, jid, nomePerfil, texto, midia, encaminhar }) {
    const chave = telefone ? chaveTelefone(telefone) : jid;
    const agora = this.agora();
    const t = normalizar(texto);
    const responder = (txt) => this.enviar(jid, txt);
    const cliente = this.store.cliente(chave);

    let s = this.store.sessao(chave);
    s.jid = jid;
    s.telefone = telefone ?? s.telefone;

    const salvar = (estado, dados = s.dados) => {
      s.estado = estado;
      s.dados = dados;
      s.atualizadoEm = this.agora();
      this.store.salvarSessao(chave, s);
    };

    // Atendimento humano em andamento: o bot fica quieto.
    if (s.estado === 'humano') {
      if (agora < s.dados.ate && t !== 'menu') return;
      s = { estado: 'inicio', dados: {}, jid, telefone };
    }

    // Sessão parada há muito tempo volta para o início (exceto lembrete pendente).
    const inativa = agora - (s.atualizadoEm ?? 0) > this.c.minutosSessaoInativa * MIN;
    if (inativa && !['inicio', 'menu', 'lembrete'].includes(s.estado)) s.estado = 'inicio';

    // Foto/PDF com pedido em aberto = comprovante do sinal: encaminha para a dona.
    if (midia) {
      const pendente = this.store.agendamentos((a) => a.cliente === chave && a.status === 'pendente' && a.inicio > agora).at(-1);
      if (pendente) {
        this.store.atualizar(pendente, { comprovanteEm: agora });
        for (const numero of this.c.numerosDona) {
          const encaminhado = encaminhar ? await encaminhar(numero).catch(() => false) : false;
          await this.enviar(numero, this.M.donaComprovante(pendente, encaminhado));
        }
        salvar(s.estado === 'inicio' ? 'menu' : s.estado);
        return responder(this.M.comprovanteRecebido());
      }
    }

    if (texto == null || t === '') {
      salvar(s.estado === 'inicio' ? 'menu' : s.estado);
      return responder(this.M.soTexto());
    }

    // Mensagem pronta do formulário de agendamento do site.
    const doSite = lerPedidoDoSite(texto, { hoje: this.hoje(), servicos: this.c.servicos });
    if (doSite) return this.receberPedidoDoSite(doSite, { chave, s, salvar, responder, telefone, jid, texto });

    // Link "Outro horário? Chama a Julia no WhatsApp" do site: vai direto para atendimento humano.
    if (s.estado === 'inicio' && /fora dos (horarios )?que aparecem/.test(t)) {
      return this.passoMenu('5', { chave, s, salvar, responder, cliente, telefone, nomePerfil });
    }

    // Comandos globais
    if (['menu', '0', 'voltar', 'inicio', 'cancelar pedido'].includes(t) && s.estado !== 'inicio') {
      salvar('menu', {});
      return responder(this.M.menu(cliente?.nome));
    }

    // Resposta a lembrete (mesmo se a cliente estiver em outro ponto da conversa)
    const lembretePendente = this.lembretePendente(chave);
    if (lembretePendente && (s.estado === 'lembrete' || temPalavra(t, 'confirmo', 'confirmad', 'confirmar presenca'))) {
      return this.responderLembrete(lembretePendente, t, s, salvar, responder);
    }
    if (s.estado === 'lembrete' && !lembretePendente) s.estado = 'inicio';

    switch (s.estado) {
      case 'inicio': {
        // Veio do botão do site ("Olá! Quero agendar ..."): pula o menu.
        if (temPalavra(t, 'agend', 'marcar')) {
          const servico = this.servicoNoTexto(t);
          await responder(this.M.saudacaoAgendamento(cliente?.nome));
          if (servico) return this.mostrarDias(servico, { s, salvar, responder });
          salvar('servico', {});
          return responder(this.M.servicos(this.c.servicos));
        }
        salvar('menu', {});
        return responder(this.M.menu(cliente?.nome));
      }
      case 'menu':
        return this.passoMenu(t, { chave, s, salvar, responder, cliente, telefone, nomePerfil });
      case 'servico':
        return this.passoServico(t, { s, salvar, responder });
      case 'dia':
        return this.passoDia(t, { s, salvar, responder });
      case 'horario':
        return this.passoHorario(t, { s, salvar, responder, cliente });
      case 'nome':
        return this.passoNome(texto, { s, salvar, responder });
      case 'confirmar':
        return this.passoConfirmar(t, { chave, s, salvar, responder, telefone, jid });
      case 'cancelar':
        return this.passoCancelar(t, { s, salvar, responder });
      default:
        salvar('menu', {});
        return responder(this.M.menu(cliente?.nome));
    }
  }

  async passoMenu(t, { chave, s, salvar, responder, cliente, telefone, nomePerfil }) {
    let n = opcao(t);
    if (n == null) {
      if (temPalavra(t, 'agend', 'marcar', 'horario')) n = 1;
      else if (temPalavra(t, 'meus', 'consultar')) n = 2;
      else if (temPalavra(t, 'cancel', 'desmarc')) n = 3;
      else if (temPalavra(t, 'servico', 'preco', 'valor', 'tabela')) n = 4;
      else if (temPalavra(t, 'atendente', 'humano', 'falar', 'pessoa', 'equipe')) n = 5;
    }

    switch (n) {
      case 1:
        salvar('servico', {});
        return responder(this.M.servicos(this.c.servicos));
      case 2:
        salvar('menu', {});
        return responder(this.M.meusAgendamentos(this.futurosDoCliente(chave)));
      case 3: {
        const lista = this.futurosDoCliente(chave);
        if (!lista.length) {
          salvar('menu', {});
          return responder(this.M.nadaParaCancelar());
        }
        salvar('cancelar', { ids: lista.map((a) => a.id) });
        return responder(this.M.escolherCancelar(lista));
      }
      case 4:
        salvar('menu', {});
        return responder(this.M.tabelaServicos(this.c.servicos));
      case 5:
        salvar('humano', { ate: this.agora() + this.c.minutosAtendimentoHumano * MIN });
        await responder(this.M.humano());
        return this.avisarDona(this.M.pediuHumano(cliente?.nome ?? nomePerfil, telefone ?? s.jid));
      default:
        // Primeira mensagem do dia costuma ser "oi", "bom dia"... mostra o menu completo.
        if (temPalavra(t, 'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'e ai')) {
          return responder(this.M.menu(cliente?.nome));
        }
        return responder(this.M.menuCurto());
    }
  }

  async passoServico(t, { s, salvar, responder }) {
    const lista = this.c.servicos;
    const n = opcao(t);
    let servico = n ? lista[n - 1] : null;
    if (!servico && n == null) {
      servico = this.servicoNoTexto(t);
      if (!servico) {
        const achados = lista.filter((sv) => normalizar(sv.nome).includes(t));
        if (achados.length === 1) servico = achados[0];
      }
    }
    if (!servico) return responder(this.M.servicos(lista));
    return this.mostrarDias(servico, { s, salvar, responder });
  }

  /** Serviço cujo nome aparece no texto (o nome mais longo vence: "fio a fio" x "volume russo"). */
  servicoNoTexto(t) {
    return this.c.servicos
      .filter((sv) => t.includes(normalizar(sv.nome)))
      .sort((a, b) => b.nome.length - a.nome.length)[0];
  }

  async mostrarDias(servico, { salvar, responder }) {
    const dias = diasDisponiveis({ config: this.c, store: this.store, duracao: servico.duracao, agora: this.agora() });
    if (!dias.length) {
      salvar('menu', {});
      return responder(this.M.semDias());
    }
    salvar('dia', { servicoId: servico.id, dias });
    return responder(this.M.dias(servico, dias));
  }

  servico(id) {
    return this.c.servicos.find((s) => s.id === id);
  }

  async passoDia(t, { s, salvar, responder }) {
    const servico = this.servico(s.dados.servicoId);
    const n = opcao(t);
    let data = n ? s.dados.dias[n - 1] : null;

    if (!data) {
      data = interpretarData(t, this.hoje());
      if (!data && temPalavra(t, 'hoje')) data = this.hoje();
      if (!data && temPalavra(t, 'amanha')) data = somarDias(this.hoje(), 1);
      if (!data) return responder(this.M.dias(servico, s.dados.dias));
      const limite = somarDias(this.hoje(), this.c.diasAntecedencia);
      if (data > limite) return responder(this.M.dataSemHorario(data));
    }

    const horarios = horariosLivres({ config: this.c, store: this.store, data, duracao: servico.duracao, agora: this.agora() });
    if (!horarios.length) return responder(this.M.dataSemHorario(data));
    salvar('horario', { ...s.dados, data, horarios });
    return responder(this.M.horarios(data, horarios));
  }

  async passoHorario(t, { s, salvar, responder, cliente }) {
    const { horarios, data } = s.dados;
    const n = opcao(t);
    let hora = n ? horarios[n - 1] : null;
    if (!hora && n == null) {
      const h = interpretarHorario(t);
      if (h && horarios.includes(h)) hora = h;
    }
    // Cliente digitou outra data em vez de um horário: troca o dia.
    if (!hora && interpretarData(t, this.hoje())) return this.passoDia(t, { s, salvar, responder });
    if (!hora) return responder(this.M.horarios(data, horarios));

    const dados = { ...s.dados, hora };
    if (cliente?.nome) {
      dados.nome = cliente.nome;
      salvar('confirmar', dados);
      return responder(this.M.resumo(this.resumoDados(dados)));
    }
    salvar('nome', dados);
    return responder(this.M.pedirNome());
  }

  async passoNome(texto, { s, salvar, responder }) {
    const nome = String(texto).replace(/[*_~]/g, '').replace(/\s+/g, ' ').trim()
      .replace(/^(meu nome e|meu nome é|sou a|sou o|sou)\s+/i, '');
    if (nome.length < 2 || nome.length > 60 || /\d/.test(nome)) return responder(this.M.nomeInvalido());
    const bonito = nome.replace(/(^|\s)\p{L}/gu, (x) => x.toUpperCase());
    const dados = { ...s.dados, nome: bonito };
    salvar('confirmar', dados);
    return responder(this.M.resumo(this.resumoDados(dados)));
  }

  resumoDados(d) {
    const sv = this.servico(d.servicoId);
    return { ...d, servicoNome: sv.nome, duracao: sv.duracao, preco: sv.preco, rotulo: sv.rotulo };
  }

  async passoConfirmar(t, { chave, s, salvar, responder, telefone, jid }) {
    const n = opcao(t) ?? (temPalavra(t, 'sim', 'confirm', 'ok', 'isso') ? 1 : temPalavra(t, 'outro', 'mudar', 'alterar') ? 2 : null);
    const servico = this.servico(s.dados.servicoId);

    if (n === 2) return this.mostrarDias(servico, { s, salvar, responder });
    if (n !== 1) return responder(this.M.resumo(this.resumoDados(s.dados)));

    const { data, hora, nome } = s.dados;
    // Revalida: alguém pode ter pego o horário enquanto a cliente digitava.
    const livres = horariosLivres({ config: this.c, store: this.store, data, duracao: servico.duracao, agora: this.agora() });
    if (!livres.includes(hora)) {
      await responder(this.M.horarioOcupou());
      return this.mostrarDias(servico, { s, salvar, responder });
    }

    const inicio = localParaEpoch(data, hora, this.c.fusoHorario);
    const ag = this.store.novoAgendamento({
      cliente: chave,
      telefone: telefone ?? '',
      jid,
      nome,
      servicoId: servico.id,
      servicoNome: servico.nome,
      rotulo: servico.rotulo,
      duracao: servico.duracao,
      data,
      hora,
      inicio,
      fim: inicio + servico.duracao * MIN,
      sinal: this.sinal(servico.preco),
      origem: 'whatsapp',
      status: 'pendente',
      criadoEm: this.agora(),
      presenca: null,
    });
    this.store.salvarCliente(chave, { nome, jid, telefone });
    salvar('menu', {});
    await responder(this.M.pedidoEnviado(ag));
    return this.avisarDona(this.M.novoPedido(ag));
  }

  async passoCancelar(t, { s, salvar, responder }) {
    const n = opcao(t);
    const id = n ? s.dados.ids[n - 1] : null;
    const ag = id && this.store.agendamento(id);
    if (!ag || !STATUS_ATIVOS.includes(ag.status)) {
      const lista = this.futurosDoCliente(s.telefone ? chaveTelefone(s.telefone) : s.jid);
      if (!lista.length) {
        salvar('menu', {});
        return responder(this.M.nadaParaCancelar());
      }
      salvar('cancelar', { ids: lista.map((a) => a.id) });
      return responder(this.M.escolherCancelar(lista));
    }
    const perde = this.perdeSinal(ag);
    this.store.atualizar(ag, { status: 'cancelado', canceladoEm: this.agora(), canceladoPor: 'cliente' });
    salvar('menu', {});
    await responder(this.M.canceladoCliente(ag, perde));
    return this.avisarDona(this.M.clienteCancelou(ag, 'menu', perde));
  }

  sinal(preco) {
    if (!this.c.sinalPercentual || preco == null) return null;
    return Math.round(preco * this.c.sinalPercentual) / 100;
  }

  /** Cancelamento em cima da hora: o sinal não é devolvido (regra do site). Só vale se havia sinal. */
  perdeSinal(ag) {
    const h = this.c.horasCancelamentoSemPerda;
    return !!(h && ag.sinal && ag.status === 'confirmado' && ag.inicio - this.agora() < h * H);
  }

  async receberPedidoDoSite(p, { chave, s, salvar, responder, telefone, jid, texto }) {
    if (!p.completo) {
      salvar('menu', {});
      await responder(this.M.pedidoSiteIlegivel());
      return this.avisarDona(this.M.donaPedidoSiteIlegivel(telefone ?? jid, texto));
    }

    const repetido = this.store
      .agendamentos((a) => a.cliente === chave && a.data === p.data && a.hora === p.hora && STATUS_ATIVOS.includes(a.status))
      .at(0);
    if (repetido) {
      salvar('menu', {});
      return responder(this.M.pedidoSiteDuplicado(repetido));
    }

    // O site só enxerga os agendamentos feitos no próprio navegador: a agenda de verdade é a do bot.
    const livres = horariosLivres({
      config: this.c, store: this.store, data: p.data, duracao: p.duracao, agora: this.agora(), antecedenciaHoras: 0,
    });
    const nome = p.nome ?? this.store.cliente(chave)?.nome ?? 'Cliente';
    if (p.nome) this.store.salvarCliente(chave, { nome: p.nome, jid, telefone });

    if (!livres.includes(p.hora)) {
      await responder(this.M.pedidoSiteOcupado(p.data, p.hora));
      await this.avisarDona(this.M.donaPedidoSiteOcupado(nome, telefone ?? jid, p.data, p.hora));
      const servico = this.servico(p.servicoId);
      if (servico) return this.mostrarDias(servico, { s, salvar, responder });
      salvar('servico', {});
      return responder(this.M.servicos(this.c.servicos));
    }

    const inicio = localParaEpoch(p.data, p.hora, this.c.fusoHorario);
    const ag = this.store.novoAgendamento({
      cliente: chave,
      telefone: telefone ?? '',
      jid,
      nome,
      servicoId: p.servicoId,
      servicoNome: p.servicoNome,
      rotulo: p.rotulo,
      duracao: p.duracao,
      data: p.data,
      hora: p.hora,
      inicio,
      fim: inicio + p.duracao * MIN,
      sinal: p.sinal ?? this.sinal(p.preco),
      origem: 'site',
      status: 'pendente',
      criadoEm: this.agora(),
      presenca: null,
    });
    salvar('menu', {});
    await responder(this.M.pedidoSiteRecebido(ag));
    return this.avisarDona(this.M.novoPedido(ag));
  }

  futurosDoCliente(chave) {
    const agora = this.agora();
    return this.store.agendamentos((a) => a.cliente === chave && STATUS_ATIVOS.includes(a.status) && a.inicio > agora);
  }

  lembretePendente(chave) {
    const agora = this.agora();
    return this.store
      .agendamentos((a) => a.cliente === chave && a.status === 'confirmado' && a.lembreteEnviadoEm && a.presenca == null && a.inicio > agora)
      .at(0);
  }

  async responderLembrete(ag, t, s, salvar, responder) {
    const n = opcao(t);
    const sim = n === 1 || temPalavra(t, 'sim', 'confirmo', 'confirmad', 'vou', 'estarei', 'ok', 'certo');
    const nao = n === 2 || temPalavra(t, 'nao', 'cancel', 'desmarc', 'nao vou', 'nao poderei');
    if (nao) {
      const perde = this.perdeSinal(ag);
      this.store.atualizar(ag, { status: 'cancelado', presenca: false, canceladoEm: this.agora(), canceladoPor: 'cliente' });
      salvar('menu', {});
      await responder(this.M.canceladoPeloLembrete(perde));
      return this.avisarDona(this.M.clienteCancelou(ag, 'lembrete', perde));
    }
    if (sim) {
      this.store.atualizar(ag, { presenca: true, presencaEm: this.agora() });
      salvar('menu', {});
      await responder(this.M.presencaConfirmada());
      return this.avisarDona(this.M.clienteConfirmouPresenca(ag));
    }
    salvar('lembrete', { agId: ag.id });
    return responder(this.M.lembreteDeNovo());
  }

  // =====================================================================
  // DONA
  // =====================================================================

  async receberDona({ jid, texto }) {
    const responder = (txt) => this.enviar(jid, txt);
    const t = normalizar(texto).replace(/[*_#]/g, '');
    if (!t) return responder(this.M.ajudaDona());
    const [cmd, ...resto] = t.split(' ');
    const original = String(texto ?? '').trim().split(/\s+/);

    const pegarPedido = () => {
      const id = /^\d+$/.test(resto[0] ?? '') ? Number(resto[0]) : null;
      const motivo = original.slice(id ? 2 : 1).join(' ').trim();
      if (id) return { ag: this.store.agendamento(id), id, motivo };
      const pend = this.store.agendamentos((a) => a.status === 'pendente');
      if (pend.length === 1) return { ag: pend[0], id: pend[0].id, motivo };
      return { ag: null, id: null, motivo, varios: pend };
    };

    if (['sim', 's', 'confirmar', 'confirmo', 'ok', 'aceito', 'aceitar'].includes(cmd)) {
      const { ag, id, varios } = pegarPedido();
      if (!ag) return responder(varios?.length > 1 ? this.M.qualPedido(varios) : this.M.pedidoNaoEncontrado(id));
      return this.confirmarPedido(ag, responder);
    }

    if (['nao', 'n', 'recusar', 'recuso', 'negar'].includes(cmd)) {
      const { ag, id, varios, motivo } = pegarPedido();
      if (!ag) return responder(varios?.length > 1 ? this.M.qualPedido(varios) : this.M.pedidoNaoEncontrado(id));
      return this.recusarPedido(ag, motivo, responder);
    }

    if (['cancelar', 'cancela', 'desmarcar'].includes(cmd)) {
      const id = /^\d+$/.test(resto[0] ?? '') ? Number(resto[0]) : null;
      const ag = id && this.store.agendamento(id);
      if (!ag) return responder(this.M.pedidoNaoEncontrado(id));
      if (!STATUS_ATIVOS.includes(ag.status)) return responder(this.M.pedidoJaDecidido(ag));
      const motivo = original.slice(2).join(' ').trim();
      this.store.atualizar(ag, { status: 'cancelado', canceladoEm: this.agora(), canceladoPor: 'salao', motivo });
      await this.enviar(ag.jid, this.M.canceladoPeloSalao(ag, motivo));
      this.resetarSessaoCliente(ag);
      return responder(this.M.donaCancelou(ag));
    }

    if (cmd === 'pendentes' || cmd === 'pendente') {
      const pend = this.store.agendamentos((a) => a.status === 'pendente');
      return responder(pend.length ? this.M.pendentes(pend) : this.M.semPendentes());
    }

    if (cmd === 'agenda') {
      const arg = resto.join(' ');
      let data = this.hoje();
      if (temPalavra(arg, 'amanha')) data = somarDias(this.hoje(), 1);
      else if (arg) data = interpretarData(arg, this.hoje()) ?? data;
      const lista = this.store.agendamentos((a) => a.data === data && STATUS_ATIVOS.includes(a.status));
      return responder(this.M.agenda(data, lista, dataFechada(this.c, this.store, data)));
    }

    if (cmd === 'fechar' || cmd === 'bloquear') {
      const data = interpretarData(resto.join(' '), this.hoje());
      if (!data) return responder(this.M.dataInvalida());
      this.store.fecharData(data);
      const afetados = this.store.agendamentos((a) => a.data === data && STATUS_ATIVOS.includes(a.status));
      return responder(this.M.diaFechado(data, afetados));
    }

    if (cmd === 'abrir' || cmd === 'desbloquear') {
      const data = interpretarData(resto.join(' '), this.hoje());
      if (!data) return responder(this.M.dataInvalida());
      this.store.abrirData(data);
      return responder(this.M.diaAberto(data));
    }

    return responder(this.M.ajudaDona());
  }

  async confirmarPedido(ag, responder) {
    if (ag.status !== 'pendente') return responder(this.M.pedidoJaDecidido(ag));
    const agora = this.agora();
    if (ag.inicio <= agora) {
      this.store.atualizar(ag, { status: 'expirado' });
      return responder(this.M.pedidoJaDecidido(ag));
    }
    // Se faltar menos que o prazo do lembrete, a própria confirmação já serve de lembrete.
    const dentroDoPrazo = ag.inicio - agora <= this.c.lembreteHorasAntes * H;
    this.store.atualizar(ag, {
      status: 'confirmado',
      decididoEm: agora,
      ...(dentroDoPrazo ? { lembreteEnviadoEm: agora, presenca: true } : {}),
    });
    await this.enviar(ag.jid, this.M.confirmadoCliente(ag, !dentroDoPrazo));
    return responder(this.M.donaConfirmou(ag));
  }

  async recusarPedido(ag, motivo, responder) {
    if (ag.status !== 'pendente') return responder(this.M.pedidoJaDecidido(ag));
    this.store.atualizar(ag, { status: 'recusado', decididoEm: this.agora(), motivo });
    await this.enviar(ag.jid, this.M.recusadoCliente(ag, motivo));
    this.resetarSessaoCliente(ag);
    return responder(this.M.donaRecusou(ag));
  }

  /** Deixa a cliente no menu, para que "1" leve direto a um novo agendamento. */
  resetarSessaoCliente(ag) {
    const s = this.store.sessao(ag.cliente);
    if (s.estado === 'humano') return;
    this.store.salvarSessao(ag.cliente, { ...s, estado: 'menu', dados: {}, atualizadoEm: this.agora() });
  }

  // =====================================================================
  // ROTINA PERIÓDICA (chamar a cada minuto)
  // =====================================================================

  async verificar() {
    const agora = this.agora();
    const c = this.c;

    for (const ag of this.store.agendamentos((a) => STATUS_ATIVOS.includes(a.status))) {
      if (ag.status === 'pendente') {
        if (ag.inicio <= agora) {
          this.store.atualizar(ag, { status: 'expirado' });
          await this.enviar(ag.jid, this.M.expiradoCliente(ag));
          this.resetarSessaoCliente(ag);
          await this.avisarDona(this.M.pedidoExpirou(ag));
        } else if (!ag.donaLembradaEm && agora - ag.criadoEm >= c.lembrarDonaPedidoPendenteMinutos * MIN) {
          this.store.atualizar(ag, { donaLembradaEm: agora });
          await this.avisarDona(this.M.pedidoAindaPendente(ag));
        }
        continue;
      }

      // confirmado
      if (ag.fim <= agora) {
        this.store.atualizar(ag, { status: 'concluido' });
        continue;
      }
      if (ag.inicio <= agora) continue; // em atendimento

      if (!ag.lembreteEnviadoEm && ag.inicio - agora <= c.lembreteHorasAntes * H) {
        this.store.atualizar(ag, { lembreteEnviadoEm: agora });
        await this.enviar(ag.jid, this.M.lembrete(ag, this.quando(ag)));
        const s = this.store.sessao(ag.cliente);
        const ocupada = !['inicio', 'menu'].includes(s.estado) && agora - (s.atualizadoEm ?? 0) < c.minutosSessaoInativa * MIN;
        if (!ocupada && s.estado !== 'humano') {
          this.store.salvarSessao(ag.cliente, { ...s, estado: 'lembrete', dados: { agId: ag.id }, atualizadoEm: agora });
        }
        continue;
      }

      if (
        ag.lembreteEnviadoEm && ag.presenca == null && !ag.donaAvisadaSemConfirmacao &&
        ag.inicio - agora <= c.avisarDonaSemConfirmacaoHorasAntes * H
      ) {
        this.store.atualizar(ag, { donaAvisadaSemConfirmacao: agora });
        await this.avisarDona(this.M.semConfirmacao(ag));
      }
    }
  }

  quando(ag) {
    const hoje = this.hoje();
    if (ag.data === hoje) return 'de *hoje*';
    if (ag.data === somarDias(hoje, 1)) return 'de *amanhã*';
    return 'marcado';
  }
}
