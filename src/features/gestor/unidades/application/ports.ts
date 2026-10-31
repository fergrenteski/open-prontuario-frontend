import type { Unidade } from '../../../../shared/domain/tipos';
import type { UnidadeRequest } from '../domain/unidade';

export interface UnidadesPort {
  listar(): Promise<Unidade[]>;
  criar(req: UnidadeRequest): Promise<Unidade>;
  atualizar(id: string, req: UnidadeRequest): Promise<void>;
  remover(id: string): Promise<void>;
}
