import type { Sessao, Usuario } from '../../../../shared/domain/tipos';

/** Porta de autenticação: implementada pelo modo dev (persona) ou pelo Entra ID (MSAL). */
export interface AutenticacaoPort {
  modo: 'dev' | 'entra';
  listarPersonas(): Promise<Usuario[]>;
  /** No modo dev recebe o id da persona; no modo entra abre o login da Microsoft. */
  entrar(usuarioId?: string): Promise<Sessao>;
}
