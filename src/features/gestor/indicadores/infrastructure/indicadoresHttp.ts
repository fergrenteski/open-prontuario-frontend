import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { Unidade } from '../../../../shared/domain/tipos';
import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { IndicadoresPort } from '../application/ports';

export function criarIndicadoresHttp(http: HttpClient): IndicadoresPort {
  return {
    listarMinhasUnidades: () => http.get<Unidade[]>('/unidades/minhas'),
    carregar: (unidadeId) => http.get<DadosAgregados>('/aggregated-data', { unidadeId }),
  };
}
