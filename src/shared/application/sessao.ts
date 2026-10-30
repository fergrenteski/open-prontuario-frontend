import { createContext, useContext } from 'react';
import type { Sessao } from '../domain/tipos';

export interface ContextoSessao {
  sessao: Sessao | null;
  entrar: (sessao: Sessao) => void;
  sair: () => void;
}

export const SessaoContext = createContext<ContextoSessao | null>(null);

export function useSessao(): ContextoSessao {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error('useSessao fora do SessaoContext');
  return ctx;
}
