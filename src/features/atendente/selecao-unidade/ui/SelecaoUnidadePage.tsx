import { Link } from 'react-router';
import { rotuloTipoUnidade } from '../../../../shared/domain/tipos';
import { AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import type { SelecaoUnidadePort } from '../application/ports';
import { useMinhasUnidades } from '../application/useMinhasUnidades';
import './selecao.css';

export function SelecaoUnidadePage({ porta }: { porta: SelecaoUnidadePort }) {
  const unidades = useMinhasUnidades(porta);

  return (
    <div className="selecao pilha">
      <header>
        <p className="sobretitulo">Atendimento</p>
        <h1 className="placa selecao__titulo">Em qual unidade você está?</h1>
        <p className="suave">Só aparecem as unidades em que você está lotado.</p>
      </header>

      {unidades.carregando && <Carregando texto="Buscando suas unidades…" />}
      {unidades.erro !== undefined && <AlertaErro erro={unidades.erro} aoTentarDeNovo={unidades.recarregar} />}
      {unidades.dados?.length === 0 && (
        <Vazio titulo="Você ainda não está lotado em nenhuma unidade">
          <p>Peça ao gestor da unidade para cadastrar a sua lotação.</p>
        </Vazio>
      )}
      {unidades.dados && unidades.dados.length > 0 && (
        <ul className="selecao__lista">
          {unidades.dados.map((u) => (
            <li key={u.id}>
              <Link to={`/atendimento/${encodeURIComponent(u.id)}/fila`} className="selecao__cartao ficha">
                <span className="selecao__tipo">{u.tipo}</span>
                <span className="placa selecao__nome">{u.nome}</span>
                <span className="suave">{rotuloTipoUnidade(u.tipo)}</span>
                <span className="selecao__abrir">
                  Abrir fila <Icone nome="seta" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
