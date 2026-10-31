import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { AuditoriaPort } from '../application/ports';
import type { LogAuditoria } from '../domain/auditoria';

export function criarAuditoriaHttp(http: HttpClient): AuditoriaPort {
  return {
    listar: ({ prontuarioId, dataInicio, dataFim }) =>
      http.get<LogAuditoria[]>(`/auditoria/prontuarios/${seg(prontuarioId)}`, { dataInicio, dataFim }),
    listarUnidades: () => http.get<Unidade[]>('/unidades'),
  };
}
