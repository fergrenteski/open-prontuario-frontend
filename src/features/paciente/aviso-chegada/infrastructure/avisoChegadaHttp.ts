import type { Unidade } from '../../../../shared/domain/tipos';
import { seg, type HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { AvisoChegadaPort } from '../application/ports';
import type { RegistroAviso } from '../domain/aviso';

export function criarAvisoChegadaHttp(http: HttpClient): AvisoChegadaPort {
  return {
    buscarUnidade: (id) => http.get<Unidade>(`/unidades/${seg(id)}`),
    avisarChegada: (id, aviso) => http.post<RegistroAviso>(`/fila/${seg(id)}/aviso-chegada`, aviso),
  };
}
