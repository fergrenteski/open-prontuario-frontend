// Consentimento no modelo Open Finance (arc42 §8.3, CONVENCOES §6). Domínio puro.

export interface Consentimento {
  id: string;
  pacienteId: string;
  unidadeId: string;
  ativo: boolean;
  valido?: boolean;
  concedidoEm: string;
  expiraEm: string;
  revogadoEm?: string | null;
}

export type SituacaoConsentimento = 'ATIVO' | 'EXPIRADO' | 'REVOGADO';

export const VALIDADE_MIN = 1;
export const VALIDADE_MAX = 365;
export const VALIDADE_PADRAO = 3;

/** estaValido(agora) = ativo && sem revogação && agora < expiraEm. */
export function estaValido(c: Consentimento, agora: Date): boolean {
  return c.ativo && !c.revogadoEm && agora.getTime() < Date.parse(c.expiraEm);
}

export function situacaoConsentimento(c: Consentimento, agora: Date): SituacaoConsentimento {
  if (estaValido(c, agora)) return 'ATIVO';
  // Desativado antes do prazo (ou com data de revogação) é revogação; senão, o prazo venceu.
  if (c.revogadoEm || (!c.ativo && agora.getTime() < Date.parse(c.expiraEm))) return 'REVOGADO';
  return 'EXPIRADO';
}

/** Dias inteiros restantes (arredonda para cima; 0 se já expirou). */
export function diasRestantes(c: Consentimento, agora: Date): number {
  return Math.max(0, Math.ceil((Date.parse(c.expiraEm) - agora.getTime()) / 86_400_000));
}

export function agruparConsentimentos(lista: Consentimento[], agora: Date): Record<SituacaoConsentimento, Consentimento[]> {
  const grupos: Record<SituacaoConsentimento, Consentimento[]> = { ATIVO: [], EXPIRADO: [], REVOGADO: [] };
  for (const c of lista) grupos[situacaoConsentimento(c, agora)].push(c);
  for (const g of Object.values(grupos)) g.sort((a, b) => Date.parse(b.concedidoEm) - Date.parse(a.concedidoEm));
  return grupos;
}

export function validarValidadeDias(dias: number): string | null {
  return Number.isInteger(dias) && dias >= VALIDADE_MIN && dias <= VALIDADE_MAX
    ? null
    : `A autorização vale de ${VALIDADE_MIN} a ${VALIDADE_MAX} dias.`;
}

/** Unidades que ainda podem receber nova autorização (sem consentimento válido). */
export function unidadesSemAutorizacao<T extends { id: string }>(unidades: T[], lista: Consentimento[], agora: Date): T[] {
  const autorizadas = new Set(lista.filter((c) => estaValido(c, agora)).map((c) => c.unidadeId));
  return unidades.filter((u) => !autorizadas.has(u.id));
}
