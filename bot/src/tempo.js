// Utilitários de data/hora no fuso do salão (sem dependências externas).

export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const pad = (n) => String(n).padStart(2, '0');

/** Partes de data/hora de um instante (ms) no fuso informado. */
export function partes(epochMs, fuso) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(epochMs)).map((x) => [x.type, x.value]));
  return {
    ano: +p.year, mes: +p.month, dia: +p.day,
    hora: +p.hour, minuto: +p.minute, segundo: +p.second,
    data: `${p.year}-${p.month}-${p.day}`,
    horario: `${p.hour}:${p.minute}`,
  };
}

function offsetMs(epochMs, fuso) {
  const p = partes(epochMs, fuso);
  const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return comoUtc - Math.floor(epochMs / 1000) * 1000;
}

/** Converte "AAAA-MM-DD" + "HH:mm" (horário local do salão) em instante (ms). */
export function localParaEpoch(data, horario, fuso) {
  const [a, m, d] = data.split('-').map(Number);
  const [h, mi] = horario.split(':').map(Number);
  const palpite = Date.UTC(a, m - 1, d, h, mi);
  let epoch = palpite - offsetMs(palpite, fuso);
  epoch = palpite - offsetMs(epoch, fuso); // corrige em caso de horário de verão
  return epoch;
}

export function somarDias(data, dias) {
  const [a, m, d] = data.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function diaSemana(data) {
  const [a, m, d] = data.split('-').map(Number);
  return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

export const paraMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const deMinutos = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

const DIAS_EXIBICAO = { dom: 'dom', seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sab: 'sáb' };

/** "qui, 20/11" */
export function dataCurta(data) {
  const [, m, d] = data.split('-');
  return `${DIAS_EXIBICAO[diaSemana(data)]}, ${d}/${m}`;
}

/** Interpreta "20/11", "20/11/2026", "20-11" a partir de uma data de referência. */
export function interpretarData(texto, hoje) {
  const r = texto.match(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/);
  if (!r) return null;
  const dia = +r[1];
  const mes = +r[2];
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
  let ano = r[3] ? +r[3] : +hoje.slice(0, 4);
  if (ano < 100) ano += 2000;
  let data = `${ano}-${pad(mes)}-${pad(dia)}`;
  if (!r[3] && data < hoje) data = `${ano + 1}-${pad(mes)}-${pad(dia)}`;
  return data;
}

/** Interpreta "14", "14h", "14:30", "14h30". */
export function interpretarHorario(texto) {
  const r = texto.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b|\b(\d{1,2})\s*horas?\b/);
  if (!r) return null;
  const h = +(r[1] ?? r[3]);
  const m = r[2] ? +r[2] : 0;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

export function duracaoTexto(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${pad(m)}` : `${h}h`;
}
