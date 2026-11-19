// Armazenamento simples em arquivo JSON (suficiente para um salão).
// Cada alteração é gravada de forma atômica (arquivo temporário + rename).

import fs from 'node:fs';
import path from 'node:path';

const VAZIO = () => ({ seq: 0, agendamentos: [], sessoes: {}, clientes: {}, datasFechadas: [] });

export class Store {
  /** @param {string|null} arquivo caminho do JSON; null = só em memória (testes/simulador) */
  constructor(arquivo) {
    this.arquivo = arquivo;
    this.db = VAZIO();
    if (arquivo && fs.existsSync(arquivo)) {
      this.db = { ...VAZIO(), ...JSON.parse(fs.readFileSync(arquivo, 'utf8')) };
    }
  }

  salvar() {
    if (!this.arquivo) return;
    fs.mkdirSync(path.dirname(this.arquivo), { recursive: true });
    const tmp = `${this.arquivo}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
    fs.renameSync(tmp, this.arquivo);
  }

  // ---------- agendamentos ----------
  novoAgendamento(dados) {
    const ag = { id: ++this.db.seq, ...dados };
    this.db.agendamentos.push(ag);
    this.salvar();
    return ag;
  }

  agendamento(id) {
    return this.db.agendamentos.find((a) => a.id === Number(id));
  }

  atualizar(ag, mudancas) {
    Object.assign(ag, mudancas);
    this.salvar();
    return ag;
  }

  agendamentos(filtro = () => true) {
    return this.db.agendamentos.filter(filtro).sort((a, b) => a.inicio - b.inicio);
  }

  // ---------- sessões de conversa ----------
  sessao(chave) {
    return this.db.sessoes[chave] ?? { estado: 'inicio', dados: {} };
  }

  salvarSessao(chave, sessao) {
    this.db.sessoes[chave] = sessao;
    this.salvar();
  }

  // ---------- clientes ----------
  cliente(chave) {
    return this.db.clientes[chave];
  }

  salvarCliente(chave, dados) {
    this.db.clientes[chave] = { ...(this.db.clientes[chave] ?? {}), ...dados };
    this.salvar();
  }

  // ---------- datas fechadas pela dona ----------
  fecharData(data) {
    if (!this.db.datasFechadas.includes(data)) this.db.datasFechadas.push(data);
    this.salvar();
  }

  abrirData(data) {
    this.db.datasFechadas = this.db.datasFechadas.filter((d) => d !== data);
    this.salvar();
  }
}
