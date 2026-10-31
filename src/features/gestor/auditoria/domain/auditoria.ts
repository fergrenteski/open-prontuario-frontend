// RF16: consulta da auditoria de um prontuário pelo gestor. Domínio puro.
import type { LogAuditoria } from '../../../../shared/domain/auditoria';

export type { LogAuditoria };

export interface FiltroAuditoria {
  prontuarioId: string;
  /** Valores de <input type="datetime-local"> (hora local do navegador). */
  de?: string;
  ate?: string;
}

export interface ConsultaAuditoria {
  prontuarioId: string;
  dataInicio?: string;
  dataFim?: string;
}

/** Valida o filtro e converte as datas locais para ISO-8601 (contrato: date-time). */
export function montarConsulta(f: FiltroAuditoria): { consulta?: ConsultaAuditoria; erro?: string } {
  const prontuarioId = f.prontuarioId.trim();
  if (!prontuarioId) return { erro: 'Informe o identificador do prontuário (ex.: pront-001).' };
  const dataInicio = f.de ? new Date(f.de).toISOString() : undefined;
  const dataFim = f.ate ? new Date(f.ate).toISOString() : undefined;
  if (dataInicio && dataFim && dataInicio > dataFim) return { erro: 'A data inicial deve ser anterior à final.' };
  return { consulta: { prontuarioId, dataInicio, dataFim } };
}
