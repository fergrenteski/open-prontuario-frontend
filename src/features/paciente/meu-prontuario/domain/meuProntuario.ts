// RF06/RF16: o titular vê o próprio prontuário e quem o acessou. Domínio puro.

export interface LogAuditoria {
  id: string;
  prontuarioId: string;
  consentimentoId: string;
  usuarioId: string;
  unidadeId: string;
  acessadoEm: string;
}

/** Acessos do mais recente para o mais antigo. */
export function acessosRecentes(acessos: LogAuditoria[]): LogAuditoria[] {
  return [...acessos].sort((a, b) => Date.parse(b.acessadoEm) - Date.parse(a.acessadoEm));
}

/** Quantas unidades diferentes já acessaram. */
export function unidadesQueAcessaram(acessos: LogAuditoria[]): number {
  return new Set(acessos.map((a) => a.unidadeId)).size;
}
