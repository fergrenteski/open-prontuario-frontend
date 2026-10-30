import { useCallback, useState } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { ErroValidacao } from '../../../../shared/domain/erros';
import { validarValidadeDias } from '../domain/consentimento';
import type { ConsentimentosPort } from './ports';

/** RF05/RF06: listar, conceder, renovar e revogar autorizações do próprio prontuário. */
export function useConsentimentos(porta: ConsentimentosPort) {
  const dados = useConsulta(async () => {
    const [consentimentos, unidades] = await Promise.all([porta.listar(), porta.listarUnidades()]);
    return { consentimentos, unidades };
  }, 'consentimentos');
  const { recarregar } = dados;
  const [mensagem, setMensagem] = useState<string>();

  const executar = useCallback(
    async (fn: () => Promise<unknown>, sucesso: string, validadeDias?: number) => {
      setMensagem(undefined);
      const invalido = validadeDias === undefined ? null : validarValidadeDias(validadeDias);
      if (invalido) throw new ErroValidacao(invalido);
      await fn();
      setMensagem(sucesso);
      await recarregar();
      return true;
    },
    [recarregar],
  );
  const acao = useAcao(executar);

  return {
    dados,
    mensagem,
    acao,
    conceder: (unidadeId: string, dias: number) =>
      acao.executar(() => porta.conceder(unidadeId, dias), `Autorização concedida por ${dias} ${dias === 1 ? 'dia' : 'dias'}.`, dias),
    renovar: (id: string, dias: number) =>
      acao.executar(() => porta.renovar(id, dias), `Autorização renovada por ${dias} ${dias === 1 ? 'dia' : 'dias'}.`, dias),
    revogar: (id: string) => acao.executar(() => porta.revogar(id), 'Autorização revogada. A unidade não vê mais seu prontuário.'),
  };
}
