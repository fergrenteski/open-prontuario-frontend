import { useCallback } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { ErroValidacao } from '../../../../shared/domain/erros';
import type { Atendimento } from '../../../../shared/domain/prontuario';
import { motivoBloqueio, validarDescricao } from '../domain/prontuario';
import type { ProntuarioPort } from './ports';

/**
 * Consulta auditada do prontuário (uma leitura por abertura da tela, sem polling, para não
 * gerar acessos desnecessários no log) e registro de atendimento pelo PROFISSIONAL.
 */
export function useProntuario(porta: ProntuarioPort, pacienteId: string, unidadeId: string) {
  const prontuario = useConsulta(() => porta.consultar(pacienteId, unidadeId), `${pacienteId}@${unidadeId}`);
  const { alterarDados } = prontuario;

  const registrar = useCallback(
    async (descricao: string): Promise<Atendimento> => {
      const invalido = validarDescricao(descricao);
      if (invalido) throw new ErroValidacao(invalido);
      const atendimento = await porta.registrarAtendimento(pacienteId, { unidadeId, descricao: descricao.trim() });
      // Acrescenta localmente: reconsultar geraria outro acesso na auditoria do paciente.
      alterarDados((p) => (p ? { ...p, historico: [...p.historico, atendimento] } : p));
      return atendimento;
    },
    [porta, pacienteId, unidadeId, alterarDados],
  );

  return { prontuario, bloqueio: motivoBloqueio(prontuario.erro), registrar: useAcao(registrar) };
}
