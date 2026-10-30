import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { UnidadesProximasPort } from '../application/ports';
import type { UnidadeProxima } from '../domain/unidadesProximas';

export function criarUnidadesProximasHttp(http: HttpClient): UnidadesProximasPort {
  return {
    listarProximas: (origem, raioKm) => http.get<UnidadeProxima[]>('/unidades/proximas', { ...origem, raioKm }),
  };
}
