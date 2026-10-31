import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { LotacoesPort } from '../application/ports';
import type { Lotacao } from '../domain/lotacao';

export function criarLotacoesHttp(http: HttpClient): LotacoesPort {
  return {
    listarUnidades: () => http.get<Unidade[]>('/unidades'),
    listar: (unidadeId) => http.get<Lotacao[]>('/lotacoes', { unidadeId }),
    criar: (dados) => http.post<Lotacao>('/lotacoes', dados),
    remover: (id) => http.delete(`/lotacoes/${seg(id)}`),
  };
}
