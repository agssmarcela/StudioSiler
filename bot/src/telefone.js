// Normalização de números de telefone para comparação.

export const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');

/**
 * Chave canônica para comparar números brasileiros com e sem o 9º dígito
 * (o WhatsApp às vezes registra 55 27 9XXXX-XXXX como 55 27 XXXX-XXXX).
 */
export function chaveTelefone(numero) {
  const d = soDigitos(numero);
  if (d.startsWith('55') && d.length === 13 && d[4] === '9') return d.slice(0, 4) + d.slice(5);
  return d;
}

export const mesmoTelefone = (a, b) => chaveTelefone(a) === chaveTelefone(b);

/** "5527999998888" -> "(27) 99999-8888" */
export function telefoneBonito(numero) {
  const d = soDigitos(numero);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const resto = d.slice(4);
    return `(${ddd}) ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`;
  }
  return `+${d}`;
}
