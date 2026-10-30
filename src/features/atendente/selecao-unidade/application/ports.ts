import type { Unidade } from '../../../../shared/domain/tipos';

export interface SelecaoUnidadePort {
  listarMinhasUnidades(): Promise<Unidade[]>;
}
