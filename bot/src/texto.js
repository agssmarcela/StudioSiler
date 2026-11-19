/** minúsculas, sem acentos, sem emojis de número (1️⃣ -> 1), espaços normalizados */
export function normalizar(texto) {
  return String(texto ?? '')
    .replace(/️?⃣/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
