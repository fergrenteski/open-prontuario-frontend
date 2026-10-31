import { useCallback, useState } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { acessosRecentes } from '../../../../shared/domain/auditoria';
import { ErroValidacao } from '../../../../shared/domain/erros';
import { montarConsulta, type FiltroAuditoria, type LogAuditoria } from '../domain/auditoria';
import type { AuditoriaPort } from './ports';

export function useAuditoria(porta: AuditoriaPort) {
  const unidades = useConsulta(() => porta.listarUnidades(), 'unidades-auditoria');
  const [resultado, setResultado] = useState<{ prontuarioId: string; acessos: LogAuditoria[] }>();

  const consultar = useCallback(
    async (filtro: FiltroAuditoria) => {
      const { consulta, erro } = montarConsulta(filtro);
      if (!consulta) throw new ErroValidacao(erro ?? 'Filtro inválido.');
      setResultado(undefined);
      const acessos = acessosRecentes(await porta.listar(consulta));
      setResultado({ prontuarioId: consulta.prontuarioId, acessos });
      return acessos;
    },
    [porta],
  );

  return { unidades, resultado, consultar: useAcao(consultar) };
}
