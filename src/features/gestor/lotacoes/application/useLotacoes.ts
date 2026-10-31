import { useCallback, useState } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { ErroValidacao } from '../../../../shared/domain/erros';
import type { Perfil } from '../../../../shared/domain/tipos';
import { ordenarLotacoes, validarLotacao, type Lotacao } from '../domain/lotacao';
import type { LotacoesPort } from './ports';

export function useLotacoes(porta: LotacoesPort, unidadeEscolhida: string | null) {
  const unidades = useConsulta(() => porta.listarUnidades(), 'unidades-lotacao');
  const unidadeId = unidadeEscolhida ?? unidades.dados?.[0]?.id ?? null;
  const lotacoes = useConsulta<Lotacao[]>(
    async () => (unidadeId ? ordenarLotacoes(await porta.listar(unidadeId)) : []),
    `lotacoes-${unidadeId ?? '-'}`,
  );
  const { recarregar } = lotacoes;
  const [mensagem, setMensagem] = useState<string>();

  const criar = useCallback(
    async (usuarioId: string, perfil: Perfil) => {
      setMensagem(undefined);
      const invalido = validarLotacao(usuarioId, perfil);
      if (invalido) throw new ErroValidacao(invalido);
      if (!unidadeId) throw new ErroValidacao('Escolha uma unidade.');
      await porta.criar({ usuarioId: usuarioId.trim(), unidadeId, perfil });
      setMensagem(`${usuarioId.trim()} lotado(a) na unidade.`);
      await recarregar();
      return true;
    },
    [porta, unidadeId, recarregar],
  );

  const remover = useCallback(
    async (l: Lotacao) => {
      setMensagem(undefined);
      await porta.remover(l.id);
      setMensagem(`Lotação de ${l.usuarioId} removida.`);
      await recarregar();
      return true;
    },
    [porta, recarregar],
  );

  return { unidades, unidadeId, lotacoes, mensagem, criar: useAcao(criar), remover: useAcao(remover) };
}
