import type { Unidade } from '../../../../shared/domain/tipos';
import type { Consentimento } from '../domain/consentimento';

export interface ConsentimentosPort {
  listar(): Promise<Consentimento[]>;
  conceder(unidadeId: string, validadeDias: number): Promise<Consentimento>;
  renovar(consentimentoId: string, validadeDias: number): Promise<Consentimento>;
  revogar(consentimentoId: string): Promise<void>;
  listarUnidades(): Promise<Unidade[]>;
}
