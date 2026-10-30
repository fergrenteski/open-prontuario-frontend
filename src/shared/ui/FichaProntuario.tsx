import { formatarDataHora } from '../domain/datas';
import { historicoRecente, type Prontuario } from '../domain/prontuario';
import { Icone } from './Icone';
import './ficha-prontuario.css';

interface Props {
  prontuario: Prontuario;
  /** id → nome da unidade, quando disponível. */
  nomeUnidade?: (unidadeId: string) => string;
}

/** Ficha clínica: alergias em destaque (risco), medicações e histórico do mais recente. */
export function FichaProntuario({ prontuario, nomeUnidade = (id) => id }: Props) {
  const historico = historicoRecente(prontuario.historico);
  return (
    <div className="ficha-pront">
      <section className="ficha-pront__bloco ficha-pront__alergias" aria-labelledby="titulo-alergias">
        <h2 id="titulo-alergias" className="sobretitulo">
          <Icone nome="alerta" tamanho={14} /> Alergias
        </h2>
        {prontuario.alergias.length === 0 ? (
          <p>Nenhuma alergia registrada.</p>
        ) : (
          <ul className="ficha-pront__itens">
            {prontuario.alergias.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="ficha-pront__bloco" aria-labelledby="titulo-medicacoes">
        <h2 id="titulo-medicacoes" className="sobretitulo">
          Medicações em uso
        </h2>
        {prontuario.medicacoes.length === 0 ? (
          <p className="suave">Nenhuma medicação registrada.</p>
        ) : (
          <ul className="ficha-pront__itens">
            {prontuario.medicacoes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="ficha-pront__bloco ficha-pront__historico" aria-labelledby="titulo-historico">
        <h2 id="titulo-historico" className="sobretitulo">
          Histórico de atendimentos
        </h2>
        {historico.length === 0 ? (
          <p className="suave">Nenhum atendimento registrado ainda.</p>
        ) : (
          <ol className="linha-tempo">
            {historico.map((a) => (
              <li key={a.id}>
                <time className="dado" dateTime={a.data}>
                  {formatarDataHora(a.data)}
                </time>
                <span className="linha-tempo__unidade">{nomeUnidade(a.unidadeId)}</span>
                <p>{a.descricao}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
