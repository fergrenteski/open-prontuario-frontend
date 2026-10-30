import { useCallback, useState } from 'react';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { infoPrioridade, type Prioridade } from '../../../../shared/domain/prioridade';
import type { MotivoSaida } from '../../../../shared/domain/tipos';
import { nomeExibicao, resultadoMotivo, type RegistroFila } from '../domain/fila';
import type { FilaPort } from './ports';

export const INTERVALO_FILA_MS = 5000;

/**
 * Painel da fila: polling de 5 s sem recarregar a página e ações de um clique.
 * Depois de qualquer ação (ou erro, como 409 de transição inválida) a fila é recarregada.
 */
export function useFila(porta: FilaPort, unidadeId: string) {
  const painel = useConsulta(() => porta.carregarPainel(unidadeId), `fila-${unidadeId}`, INTERVALO_FILA_MS);
  const [emAndamento, setEmAndamento] = useState<string>();
  const [erroAcao, setErroAcao] = useState<unknown>();
  const [mensagem, setMensagem] = useState<string>();
  const { recarregar } = painel;

  const rodar = useCallback(
    async (registro: RegistroFila, fn: () => Promise<void>, sucesso: string) => {
      setEmAndamento(registro.id);
      setErroAcao(undefined);
      setMensagem(undefined);
      try {
        await fn();
        setMensagem(sucesso);
      } catch (e) {
        setErroAcao(e);
      } finally {
        setEmAndamento(undefined);
        await recarregar();
      }
    },
    [recarregar],
  );

  return {
    painel,
    emAndamento,
    erroAcao,
    mensagem,
    confirmarChegada: (r: RegistroFila) =>
      rodar(r, () => porta.confirmarChegada(r.id), `Chegada de ${nomeExibicao(r)} confirmada.`),
    alterarPrioridade: (r: RegistroFila, p: Prioridade) =>
      rodar(r, () => porta.alterarPrioridade(r.id, p), `${nomeExibicao(r)} agora é ${infoPrioridade(p).rotulo}.`),
    iniciarAtendimento: (r: RegistroFila) =>
      rodar(r, () => porta.iniciarAtendimento(r.id), `Atendimento de ${nomeExibicao(r)} iniciado.`),
    encerrar: (r: RegistroFila, motivo: MotivoSaida) =>
      rodar(r, () => porta.encerrar(r.id, motivo), `${nomeExibicao(r)} saiu da fila (${resultadoMotivo(motivo)}).`),
  };
}
