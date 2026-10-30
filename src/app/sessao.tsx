import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { SessaoContext } from '../shared/application/sessao';
import type { Sessao } from '../shared/domain/tipos';
import { assinar, sessaoAtual, sessaoGlobal } from './sessaoGlobal';

export function SessaoProvider({ children }: { children: ReactNode }) {
  const sessao = useSyncExternalStore(assinar, sessaoAtual);
  const entrar = useCallback((s: Sessao) => sessaoGlobal.definir(s), []);
  const sair = useCallback(() => sessaoGlobal.definir(null), []);
  const valor = useMemo(() => ({ sessao, entrar, sair }), [sessao, entrar, sair]);
  return <SessaoContext value={valor}>{children}</SessaoContext>;
}
