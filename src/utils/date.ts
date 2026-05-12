export function getDataAtualISO(): string {
  return new Date().toISOString(); // mantém hora exata do servidor.
}