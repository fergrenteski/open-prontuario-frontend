import type { Unidade } from '../../../../shared/domain/tipos';
import type { ConsultaAuditoria, LogAuditoria } from '../domain/auditoria';

export interface AuditoriaPort {
  listar(consulta: ConsultaAuditoria): Promise<LogAuditoria[]>;
  listarUnidades(): Promise<Unidade[]>;
}
