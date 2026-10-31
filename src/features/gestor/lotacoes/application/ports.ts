import type { Perfil, Unidade } from '../../../../shared/domain/tipos';
import type { Lotacao } from '../domain/lotacao';

export interface LotacoesPort {
  listarUnidades(): Promise<Unidade[]>;
  listar(unidadeId: string): Promise<Lotacao[]>;
  criar(dados: { usuarioId: string; unidadeId: string; perfil: Perfil }): Promise<Lotacao>;
  remover(lotacaoId: string): Promise<void>;
}
