import type { Prontuario } from '../../../../shared/domain/prontuario';
import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { MeuProntuarioPort } from '../application/ports';
import type { LogAuditoria } from '../domain/meuProntuario';

export function criarMeuProntuarioHttp(http: HttpClient): MeuProntuarioPort {
  return {
    consultarMeu: () => http.get<Prontuario>('/prontuarios/me'),
    listarAcessos: (id) => http.get<LogAuditoria[]>(`/auditoria/prontuarios/${seg(id)}`),
    listarUnidades: () => http.get<Unidade[]>('/unidades'),
  };
}
