import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import { seg } from '../../../../shared/infrastructure/httpClient';
import type { FilaPort } from '../application/ports';

export function criarFilaHttp(http: HttpClient): FilaPort {
  return {
    carregarPainel: (unidadeId) => http.get<DadosAgregados>('/aggregated-data', { unidadeId }),
    confirmarChegada: (id) => http.post(`/fila/${seg(id)}/confirmar-chegada`),
    alterarPrioridade: (id, prioridade) => http.patch(`/fila/${seg(id)}/prioridade`, { prioridade }),
    iniciarAtendimento: (id) => http.post(`/fila/${seg(id)}/iniciar-atendimento`),
    encerrar: (id, motivo) => http.delete(`/fila/${seg(id)}`, { motivo }),
  };
}
