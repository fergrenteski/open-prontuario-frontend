import { useCallback, useState } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { ordenarPorNome, validarUnidade, type ErrosUnidade, type FormUnidade } from '../domain/unidade';
import type { UnidadesPort } from './ports';

/** CRUD completo de unidades (listar, criar, editar, remover). */
export function useGestaoUnidades(porta: UnidadesPort) {
  const unidades = useConsulta(async () => ordenarPorNome(await porta.listar()), 'gestao-unidades');
  const { recarregar } = unidades;
  const [erros, setErros] = useState<ErrosUnidade>({});
  const [mensagem, setMensagem] = useState<string>();

  const salvar = useCallback(
    async (form: FormUnidade, id?: string) => {
      setMensagem(undefined);
      const { req, erros: e } = validarUnidade(form);
      setErros(e);
      if (!req) return false;
      if (id) await porta.atualizar(id, req);
      else await porta.criar(req);
      setMensagem(id ? `${req.nome} atualizada.` : `${req.nome} criada.`);
      await recarregar();
      return true;
    },
    [porta, recarregar],
  );

  const remover = useCallback(
    async (id: string, nome: string) => {
      setMensagem(undefined);
      await porta.remover(id);
      setMensagem(`${nome} removida.`);
      await recarregar();
      return true;
    },
    [porta, recarregar],
  );

  return { unidades, erros, mensagem, salvar: useAcao(salvar), remover: useAcao(remover) };
}
