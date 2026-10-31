// RF06/RF16: o titular vê o próprio prontuário e quem o acessou. Domínio puro.
import type { LogAuditoria } from '../../../../shared/domain/auditoria';

export type { LogAuditoria };

/** Quantas unidades diferentes já acessaram. */
export function unidadesQueAcessaram(acessos: LogAuditoria[]): number {
  return new Set(acessos.map((a) => a.unidadeId)).size;
}
