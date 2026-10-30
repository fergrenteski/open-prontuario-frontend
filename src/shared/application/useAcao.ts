import { useCallback, useState } from 'react';

export interface Acao<A extends unknown[], R> {
  executar: (...args: A) => Promise<R | undefined>;
  pendente: boolean;
  erro: unknown;
  limparErro: () => void;
}

/** Executa um caso de uso de escrita guardando "pendente" e o erro (para exibir por `codigo`). */
export function useAcao<A extends unknown[], R>(fn: (...args: A) => Promise<R>): Acao<A, R> {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<unknown>();

  const executar = useCallback(
    async (...args: A) => {
      setPendente(true);
      setErro(undefined);
      try {
        return await fn(...args);
      } catch (e) {
        setErro(e);
        return undefined;
      } finally {
        setPendente(false);
      }
    },
    [fn],
  );

  return { executar, pendente, erro, limparErro: useCallback(() => setErro(undefined), []) };
}
