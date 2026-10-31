import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { UnidadesPort } from '../application/ports';

export function criarUnidadesHttp(http: HttpClient): UnidadesPort {
  return {
    listar: () => http.get<Unidade[]>('/unidades'),
    criar: (req) => http.post<Unidade>('/unidades', req),
    atualizar: (id, req) => http.put(`/unidades/${seg(id)}`, req),
    remover: (id) => http.delete(`/unidades/${seg(id)}`),
  };
}
