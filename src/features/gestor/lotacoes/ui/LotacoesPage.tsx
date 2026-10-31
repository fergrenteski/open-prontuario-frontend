import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { rotuloPerfil } from '../../../../shared/domain/perfis';
import type { Perfil } from '../../../../shared/domain/tipos';
import { Alerta, AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import { SeletorUnidade } from '../../../../shared/ui/SeletorUnidade';
import '../../../../shared/ui/gestao.css';
import type { LotacoesPort } from '../application/ports';
import { useLotacoes } from '../application/useLotacoes';
import { PERFIS_LOTACAO } from '../domain/lotacao';

export function LotacoesPage({ porta }: { porta: LotacoesPort }) {
  const [params, setParams] = useSearchParams();
  const l = useLotacoes(porta, params.get('unidadeId'));
  const [usuarioId, setUsuarioId] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('ATENDENTE');
  const [removendo, setRemovendo] = useState<string>();
  const nomeUnidade = l.unidades.dados?.find((u) => u.id === l.unidadeId)?.nome ?? l.unidadeId;

  async function aoCriar(e: FormEvent) {
    e.preventDefault();
    if (await l.criar.executar(usuarioId, perfil)) setUsuarioId('');
  }

  return (
    <div className="gestao pilha">
      <header>
        <p className="sobretitulo">Cadastro</p>
        <h1 className="placa gestao__titulo">Lotações</h1>
        <p className="suave">Quem está lotado em cada unidade define quem vê a fila e pode abrir prontuários autorizados.</p>
      </header>

      {l.unidades.carregando && <Carregando />}
      {l.unidades.erro !== undefined && <AlertaErro erro={l.unidades.erro} aoTentarDeNovo={l.unidades.recarregar} />}
      {l.unidades.dados && l.unidades.dados.length > 0 && (
        <SeletorUnidade unidades={l.unidades.dados} valor={l.unidadeId} aoMudar={(id) => setParams({ unidadeId: id })} />
      )}
      {l.mensagem && <Alerta tipo="sucesso">{l.mensagem}</Alerta>}
      {l.remover.erro !== undefined && <AlertaErro erro={l.remover.erro} />}

      {l.unidadeId && (
        <div className="gestao__duas-colunas">
          <section className="ficha gestao__tabela" aria-labelledby="titulo-lotados">
            <h2 id="titulo-lotados" className="gestao__secao">
              Lotados em {nomeUnidade}
            </h2>
            {l.lotacoes.carregando && <Carregando />}
            {l.lotacoes.erro !== undefined && <AlertaErro erro={l.lotacoes.erro} aoTentarDeNovo={l.lotacoes.recarregar} />}
            {l.lotacoes.dados?.length === 0 && <Vazio titulo="Ninguém lotado nesta unidade" />}
            {l.lotacoes.dados && l.lotacoes.dados.length > 0 && (
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">
                      <span className="visualmente-oculto">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {l.lotacoes.dados.map((x) => (
                    <tr key={x.id}>
                      <td className="dado">{x.usuarioId}</td>
                      <td>{rotuloPerfil(x.perfil)}</td>
                      <td>
                        <div className="gestao__acoes-linha">
                          {removendo === x.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn--compacto btn--perigo"
                                disabled={l.remover.pendente}
                                onClick={async () => {
                                  await l.remover.executar(x);
                                  setRemovendo(undefined);
                                }}
                              >
                                Confirmar remoção
                              </button>
                              <button type="button" className="btn btn--compacto" onClick={() => setRemovendo(undefined)}>
                                Manter
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn--compacto btn--perigo"
                              onClick={() => setRemovendo(x.id)}
                              aria-label={`Remover lotação de ${x.usuarioId}`}
                            >
                              <Icone nome="lixeira" /> Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <form className="ficha gestao__form" onSubmit={aoCriar} noValidate aria-labelledby="titulo-nova-lotacao">
            <h2 id="titulo-nova-lotacao" className="gestao__secao">
              Nova lotação
            </h2>
            <div className="campo">
              <label htmlFor="lot-usuario">Usuário</label>
              <input id="lot-usuario" name="lot-usuario" type="text" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} placeholder="usr-prof-03…" autoComplete="off" spellCheck={false} />
              <span className="ajuda">Identificador (oid) do usuário no Entra ID.</span>
            </div>
            <div className="campo">
              <label htmlFor="lot-perfil">Perfil</label>
              <select id="lot-perfil" name="lot-perfil" value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
                {PERFIS_LOTACAO.map((p) => (
                  <option key={p} value={p}>
                    {rotuloPerfil(p)}
                  </option>
                ))}
              </select>
            </div>
            {l.criar.erro !== undefined && <AlertaErro erro={l.criar.erro} />}
            <button type="submit" className="btn btn--primario" disabled={l.criar.pendente}>
              Lotar na unidade
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
