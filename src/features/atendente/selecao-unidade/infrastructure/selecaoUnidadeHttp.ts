import type { Unidade } from '../../../../shared/domain/tipos';
import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { SelecaoUnidadePort } from '../application/ports';

export function criarSelecaoUnidadeHttp(http: HttpClient): SelecaoUnidadePort {
  return { listarMinhasUnidades: () => http.get<Unidade[]>('/unidades/minhas') };
}
