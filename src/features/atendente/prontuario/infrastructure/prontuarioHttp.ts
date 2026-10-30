import type { Atendimento, Prontuario } from '../../../../shared/domain/prontuario';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { ProntuarioPort } from '../application/ports';

export function criarProntuarioHttp(http: HttpClient): ProntuarioPort {
  return {
    consultar: (pacienteId, unidadeId) => http.get<Prontuario>(`/prontuarios/${seg(pacienteId)}`, { unidadeId }),
    registrarAtendimento: (pacienteId, dados) => http.post<Atendimento>(`/prontuarios/${seg(pacienteId)}/atendimentos`, dados),
  };
}
