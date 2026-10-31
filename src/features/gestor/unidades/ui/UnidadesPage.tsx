import { useState, type FormEvent } from 'react';
import { ErroApi } from '../../../../shared/domain/erros';
import type { Unidade } from '../../../../shared/domain/tipos';
import { Alerta, AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { focarPrimeiroInvalido } from '../../../../shared/ui/foco';
import { Icone } from '../../../../shared/ui/Icone';
import '../../../../shared/ui/gestao.css';
import type { UnidadesPort } from '../application/ports';
import { useGestaoUnidades } from '../application/useGestaoUnidades';
import { FORM_VAZIO, formDe, type FormUnidade } from '../domain/unidade';

export function UnidadesPage({ porta }: { porta: UnidadesPort }) {
  const g = useGestaoUnidades(porta);
  const [form, setForm] = useState<FormUnidade>(FORM_VAZIO);
  const [editando, setEditando] = useState<Unidade>();
  const [removendo, setRemovendo] = useState<string>();

  function editar(u: Unidade) {
    setEditando(u);
    setForm(formDe(u));
    document.getElementById('unidade-nome')?.focus();
  }

  function cancelar() {
    setEditando(undefined);
    setForm(FORM_VAZIO);
  }

  async function aoSalvar(e: FormEvent) {
    e.preventDefault();
    const formulario = e.currentTarget as HTMLFormElement;
    if (await g.salvar.executar(form, editando?.id)) cancelar();
    else focarPrimeiroInvalido(formulario);
  }

  const campo = (k: keyof FormUnidade) => ({
    id: `unidade-${k}`,
    name: `unidade-${k}`,
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
    'aria-invalid': !!g.erros[k],
    'aria-describedby': g.erros[k] ? `erro-${k}` : undefined,
  });
  const erro = (k: keyof FormUnidade) =>
    g.erros[k] && (
      <span id={`erro-${k}`} className="erro-campo">
        {g.erros[k]}
      </span>
    );

  const erroRemocao = g.remover.erro;
  return (
    <div className="gestao pilha">
      <header>
        <p className="sobretitulo">Cadastro</p>
        <h1 className="placa gestao__titulo">Unidades de saúde</h1>
      </header>
      {g.mensagem && <Alerta tipo="sucesso">{g.mensagem}</Alerta>}
      {erroRemocao !== undefined && (
        <AlertaErro
          erro={erroRemocao}
          mensagem={erroRemocao instanceof ErroApi && erroRemocao.status === 409 ? 'A unidade não pode ser removida: ainda há pacientes na fila ou profissionais lotados nela.' : undefined}
        />
      )}

      <div className="gestao__duas-colunas">
        <section className="ficha gestao__tabela" aria-labelledby="titulo-lista">
          <h2 id="titulo-lista" className="gestao__secao">
            Cadastradas
          </h2>
          {g.unidades.carregando && <Carregando />}
          {g.unidades.erro !== undefined && <AlertaErro erro={g.unidades.erro} aoTentarDeNovo={g.unidades.recarregar} />}
          {g.unidades.dados?.length === 0 && <Vazio titulo="Nenhuma unidade cadastrada" />}
          {g.unidades.dados && g.unidades.dados.length > 0 && (
            <div className="rolagem-x">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Coordenadas</th>
                    <th scope="col">
                      <span className="visualmente-oculto">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.unidades.dados.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.nome}</strong>
                        <div className="dado suave">{u.id}</div>
                      </td>
                      <td>{u.tipo}</td>
                      <td className="dado">
                        {u.latitude}, {u.longitude}
                      </td>
                      <td>
                        <div className="gestao__acoes-linha">
                          <button type="button" className="btn btn--compacto" onClick={() => editar(u)} aria-label={`Editar ${u.nome}`}>
                            <Icone nome="editar" /> Editar
                          </button>
                          {removendo === u.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn--compacto btn--perigo"
                                disabled={g.remover.pendente}
                                onClick={async () => {
                                  await g.remover.executar(u.id, u.nome);
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
                            <button type="button" className="btn btn--compacto btn--perigo" onClick={() => setRemovendo(u.id)} aria-label={`Remover ${u.nome}`}>
                              <Icone nome="lixeira" /> Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="ficha gestao__form" onSubmit={aoSalvar} noValidate aria-labelledby="titulo-form">
          <h2 id="titulo-form" className="gestao__secao">
            {editando ? `Editar ${editando.nome}` : 'Nova unidade'}
          </h2>
          <div className="campo">
            <label htmlFor="unidade-nome">Nome</label>
            <input type="text" autoComplete="off" {...campo('nome')} />
            {erro('nome')}
          </div>
          <div className="campo">
            <label htmlFor="unidade-tipo">Tipo</label>
            <select {...campo('tipo')}>
              <option value="UPA">UPA — Pronto Atendimento</option>
              <option value="UBS">UBS — Unidade Básica</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="unidade-latitude">Latitude</label>
            <input type="text" inputMode="decimal" placeholder="-25.4284…" {...campo('latitude')} />
            {erro('latitude')}
          </div>
          <div className="campo">
            <label htmlFor="unidade-longitude">Longitude</label>
            <input type="text" inputMode="decimal" placeholder="-49.2733…" {...campo('longitude')} />
            {erro('longitude')}
          </div>
          {g.salvar.erro !== undefined && <AlertaErro erro={g.salvar.erro} />}
          <div className="linha-acoes">
            <button type="submit" className="btn btn--primario" disabled={g.salvar.pendente}>
              {editando ? 'Salvar alterações' : 'Criar unidade'}
            </button>
            {editando && (
              <button type="button" className="btn" onClick={cancelar}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
