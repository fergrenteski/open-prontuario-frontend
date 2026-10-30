import { useCallback, useEffect, useRef, useState } from 'react';

interface Estado<T> {
  chave: string | null;
  dados?: T;
  erro?: unknown;
}

export interface Consulta<T> {
  dados: T | undefined;
  erro: unknown;
  /** Primeira carga da chave atual (sem dados ainda). */
  carregando: boolean;
  recarregar: () => Promise<void>;
  /** Atualização local (ex.: item recém-criado) sem nova ida ao servidor. */
  alterarDados: (fn: (atual: T | undefined) => T | undefined) => void;
}

/**
 * Busca dados de uma porta, refaz quando `chave` muda e, com `intervaloMs`, faz polling
 * mantendo os dados atuais na tela (sem "piscar"). Erros de atualização não apagam os dados.
 */
export function useConsulta<T>(buscar: () => Promise<T>, chave: string, intervaloMs?: number): Consulta<T> {
  const buscarRef = useRef(buscar);
  const chaveRef = useRef(chave);
  const [estado, setEstado] = useState<Estado<T>>({ chave: null });

  useEffect(() => {
    buscarRef.current = buscar;
  });

  const executar = useCallback(async (paraChave: string) => {
    try {
      const dados = await buscarRef.current();
      if (chaveRef.current === paraChave) setEstado({ chave: paraChave, dados });
    } catch (erro) {
      if (chaveRef.current === paraChave) {
        setEstado((ant) => ({ chave: paraChave, dados: ant.chave === paraChave ? ant.dados : undefined, erro }));
      }
    }
  }, []);

  useEffect(() => {
    chaveRef.current = chave;
    void executar(chave);
    if (!intervaloMs) return;
    const id = setInterval(() => void executar(chave), intervaloMs);
    return () => clearInterval(id);
  }, [chave, intervaloMs, executar]);

  const recarregar = useCallback(() => executar(chaveRef.current), [executar]);
  const alterarDados = useCallback(
    (fn: (atual: T | undefined) => T | undefined) => setEstado((ant) => ({ ...ant, dados: fn(ant.dados) })),
    [],
  );

  const atual = estado.chave === chave;
  return {
    dados: atual ? estado.dados : undefined,
    erro: atual ? estado.erro : undefined,
    carregando: !atual,
    recarregar,
    alterarDados,
  };
}
