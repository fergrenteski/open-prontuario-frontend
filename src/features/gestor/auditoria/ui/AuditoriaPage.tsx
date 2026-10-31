import { useState, type FormEvent } from 'react';
import { formatarDataHora } from '../../../../shared/domain/datas';
import { temCodigo } from '../../../../shared/domain/erros';
import { nomesDeUnidades } from '../../../../shared/domain/tipos';
import { AlertaErro, Vazio } from '../../../../shared/ui/Estados';
import type { AuditoriaPort } from '../application/ports';
import { useAuditoria } from '../application/useAuditoria';
import '../../../../shared/ui/gestao.css';

export function AuditoriaPage({ porta }: { porta: AuditoriaPort }) {
  const { unidades, resultado, consultar } = useAuditoria(porta);
  const [prontuarioId, setProntuarioId] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const nome = nomesDeUnidades(unidades.dados);

  function aoConsultar(e: FormEvent) {
    e.preventDefault();
    void consultar.executar({ prontuarioId, de, ate });
  }

  return (
    <div className="gestao pilha">
      <header>
        <p className="sobretitulo">Auditoria</p>
        <h1 className="placa gestao__titulo">Acessos a um prontuário</h1>
        <p className="suave">Registro imutável de cada abertura de prontuário. Você vê os acessos feitos nas unidades em que é gestor.</p>
      </header>

      <form className="ficha gestao__filtro" onSubmit={aoConsultar} noValidate>
        <div className="campo">
          <label htmlFor="aud-prontuario">Prontuário</label>
          <input id="aud-prontuario" name="aud-prontuario" type="text" value={prontuarioId} onChange={(e) => setProntuarioId(e.target.value)} placeholder="pront-001…" autoComplete="off" spellCheck={false} />
        </div>
        <div className="campo">
          <label htmlFor="aud-de">De</label>
          <input id="aud-de" name="aud-de" type="datetime-local" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="aud-ate">Até</label>
          <input id="aud-ate" name="aud-ate" type="datetime-local" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--primario" disabled={consultar.pendente}>
          {consultar.pendente ? 'Consultando…' : 'Consultar acessos'}
        </button>
      </form>

      {consultar.erro !== undefined && (
        <AlertaErro
          erro={consultar.erro}
          mensagem={temCodigo(consultar.erro, 'SEM_PERMISSAO') ? 'Este prontuário não tem acessos nas unidades em que você é gestor, ou seu perfil não permite a consulta.' : undefined}
        />
      )}

      {resultado &&
        (resultado.acessos.length === 0 ? (
          <Vazio titulo="Nenhum acesso no período">
            <p>Ninguém abriu o prontuário {resultado.prontuarioId} com os filtros informados.</p>
          </Vazio>
        ) : (
          <section className="ficha gestao__tabela" aria-labelledby="titulo-acessos">
            <h2 id="titulo-acessos" className="gestao__secao">
              {resultado.acessos.length} {resultado.acessos.length === 1 ? 'acesso' : 'acessos'} a <span className="dado">{resultado.prontuarioId}</span>
            </h2>
            <div className="rolagem-x">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Quando</th>
                    <th scope="col">Unidade</th>
                    <th scope="col">Profissional</th>
                    <th scope="col">Autorização usada</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.acessos.map((a) => (
                    <tr key={a.id}>
                      <td className="dado">{formatarDataHora(a.acessadoEm)}</td>
                      <td>{nome(a.unidadeId)}</td>
                      <td className="dado">{a.usuarioId}</td>
                      <td className="dado">{a.consentimentoId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  );
}
