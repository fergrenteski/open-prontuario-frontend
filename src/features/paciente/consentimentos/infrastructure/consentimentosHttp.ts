import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { ConsentimentosPort } from '../application/ports';
import type { Consentimento } from '../domain/consentimento';

export function criarConsentimentosHttp(http: HttpClient): ConsentimentosPort {
  return {
    listar: () => http.get<Consentimento[]>('/consentimentos'),
    conceder: (unidadeId, validadeDias) => http.post<Consentimento>('/consentimentos', { unidadeId, validadeDias }),
    renovar: (id, validadeDias) => http.put<Consentimento>(`/consentimentos/${seg(id)}`, { validadeDias }),
    revogar: (id) => http.delete(`/consentimentos/${seg(id)}`),
    listarUnidades: () => http.get<Unidade[]>('/unidades'),
  };
}
