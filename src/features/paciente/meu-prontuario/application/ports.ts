import type { Prontuario } from '../../../../shared/domain/prontuario';
import type { Unidade } from '../../../../shared/domain/tipos';
import type { LogAuditoria } from '../domain/meuProntuario';

export interface MeuProntuarioPort {
  consultarMeu(): Promise<Prontuario>;
  listarAcessos(prontuarioId: string): Promise<LogAuditoria[]>;
  listarUnidades(): Promise<Unidade[]>;
}
