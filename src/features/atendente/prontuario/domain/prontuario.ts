// Regras do prontuário visto pelo profissional (RF12/RF15). Domínio puro.
import { temCodigo } from '../../../../shared/domain/erros';

export const DESCRICAO_MIN = 3;
export const DESCRICAO_MAX = 2000;

/** RegistrarAtendimentoRequest: descrição de 3 a 2000 caracteres (sem contar espaços nas pontas). */
export function validarDescricao(descricao: string): string | null {
  const t = descricao.trim();
  if (t.length < DESCRICAO_MIN) return `Descreva o atendimento com pelo menos ${DESCRICAO_MIN} caracteres.`;
  if (t.length > DESCRICAO_MAX) return `Use no máximo ${DESCRICAO_MAX} caracteres.`;
  return null;
}

export type MotivoBloqueio = 'sem-consentimento' | 'sem-lotacao' | 'auditoria-indisponivel' | 'sem-prontuario';

/** Traduz a recusa do BFF no motivo mostrado ao profissional (fail-closed: nada é exibido). */
export function motivoBloqueio(erro: unknown): MotivoBloqueio | null {
  if (temCodigo(erro, 'CONSENTIMENTO_AUSENTE')) return 'sem-consentimento';
  if (temCodigo(erro, 'SEM_PERMISSAO')) return 'sem-lotacao';
  if (temCodigo(erro, 'DEPENDENCIA_INDISPONIVEL')) return 'auditoria-indisponivel';
  if (temCodigo(erro, 'RECURSO_NAO_ENCONTRADO')) return 'sem-prontuario';
  return null;
}
