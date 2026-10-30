import { useConsulta } from '../../../../shared/application/useConsulta';
import { ordenarUnidades } from '../domain/selecao';
import type { SelecaoUnidadePort } from './ports';

/** RF07: unidades em que o usuário está lotado, ordenadas para escolha rápida. */
export function useMinhasUnidades(porta: SelecaoUnidadePort) {
  return useConsulta(async () => ordenarUnidades(await porta.listarMinhasUnidades()), 'minhas-unidades');
}
