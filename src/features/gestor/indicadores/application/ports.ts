import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { Unidade } from '../../../../shared/domain/tipos';

export interface IndicadoresPort {
  listarMinhasUnidades(): Promise<Unidade[]>;
  carregar(unidadeId: string): Promise<DadosAgregados>;
}
