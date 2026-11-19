// Cálculo de horários disponíveis.

import { diaSemana, localParaEpoch, paraMinutos, deMinutos, somarDias, partes } from './tempo.js';

export const STATUS_ATIVOS = ['pendente', 'confirmado'];

export function dataFechada(config, store, data) {
  return (config.datasFechadas ?? []).includes(data) || store.db.datasFechadas.includes(data);
}

/** Lista de horários "HH:mm" livres numa data para um serviço com a duração dada. */
export function horariosLivres({ config, store, data, duracao, agora, antecedenciaHoras }) {
  if (dataFechada(config, store, data)) return [];
  const expediente = config.horarios[diaSemana(data)];
  if (!expediente) return [];

  const [abre, fecha] = expediente.map(paraMinutos);
  const passo = config.intervaloMinutos ?? 30;
  const capacidade = config.atendimentosSimultaneos ?? 1;
  const minimo = agora + (antecedenciaHoras ?? config.antecedenciaMinimaHoras ?? 0) * 3600e3;
  const pausas = (config.pausas ?? []).map(([i, f]) => [paraMinutos(i), paraMinutos(f)]);
  const ocupados = store.agendamentos((a) => a.data === data && STATUS_ATIVOS.includes(a.status));

  const livres = [];
  for (let t = abre; t + duracao <= fecha; t += passo) {
    const fimMin = t + duracao;
    if (pausas.some(([pi, pf]) => t < pf && fimMin > pi)) continue;

    const horario = deMinutos(t);
    const inicio = localParaEpoch(data, horario, config.fusoHorario);
    if (inicio < minimo) continue;
    const fim = inicio + duracao * 60e3;

    const conflitos = ocupados.filter((a) => a.inicio < fim && a.fim > inicio).length;
    if (conflitos >= capacidade) continue;
    livres.push(horario);
  }
  return livres;
}

/** Próximos dias (AAAA-MM-DD) com pelo menos um horário livre. */
export function diasDisponiveis({ config, store, duracao, agora, limite = 7 }) {
  const hoje = partes(agora, config.fusoHorario).data;
  const dias = [];
  for (let i = 0; i <= (config.diasAntecedencia ?? 21) && dias.length < limite; i++) {
    const data = somarDias(hoje, i);
    if (horariosLivres({ config, store, data, duracao, agora }).length) dias.push(data);
  }
  return dias;
}
