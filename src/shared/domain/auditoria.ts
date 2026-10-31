/** Registro append-only de acesso a prontuário (MS Prontuário). */
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
