import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useSessao } from '../../../../shared/application/sessao';
import { formatarDuracao } from '../../../../shared/domain/datas';
import { descreverFonte } from '../../../../shared/domain/agregacao';
import { temPerfil } from '../../../../shared/domain/perfis';
import { PRIORIDADES, infoPrioridade, type Prioridade } from '../../../../shared/domain/prioridade';
import { Alerta, AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import { Medidor } from '../../../../shared/ui/Medidor';
import { Pulseira } from '../../../../shared/ui/Pulseira';
import type { FilaPort } from '../application/ports';
import { INTERVALO_FILA_MS, useFila } from '../application/useFila';
import {
  acoesPermitidas,
  agruparFila,
  contarFila,
  nomeExibicao,
  rotuloMotivo,
  situacao,
  type FiltroFila,
  type RegistroFila,
} from '../domain/fila';
import './fila.css';

const FILTROS: { valor: FiltroFila; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'presentes', rotulo: 'Presentes' },
  { valor: 'a-caminho', rotulo: 'A caminho' },
];

const horaComSegundos = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function FilaPage({ porta }: { porta: FilaPort }) {
  const { unidadeId = '' } = useParams();
  const { sessao } = useSessao();
  const fila = useFila(porta, unidadeId);
  const [filtro, setFiltro] = useState<FiltroFila>('todos');
  const podeOperar = temPerfil(sessao?.usuario, 'ATENDENTE', 'PROFISSIONAL');
  const { dados, erro, carregando, recarregar } = fila.painel;

  if (carregando) return <Carregando texto="Carregando a fila…" />;
  if (!dados) return <AlertaErro erro={erro} aoTentarDeNovo={recarregar} />;

  const registros = dados.fila ?? [];
  const agora = new Date(dados.meta.geradoEm);
  const grupos = agruparFila(registros, filtro);
  const contagem = contarFila(registros);
  const visao = dados.visaoAgregada;

  return (
    <div className="fila pilha">
      <header className="fila__cabecalho">
        <div>
          <p className="sobretitulo">Fila da unidade · {dados.unidade?.tipo ?? unidadeId}</p>
          <h1 className="placa fila__unidade">{dados.unidade?.nome ?? unidadeId}</h1>
        </div>
        <div className="fila__ao-vivo">
          <span className="fila__pulso" aria-hidden="true" />
          <span>
            Atualizado às <span className="dado">{horaComSegundos.format(agora)}</span>
            <span className="suave"> · a cada {INTERVALO_FILA_MS / 1000} s</span>
          </span>
          <Link to="/atendimento" className="btn btn--compacto">
            Trocar unidade
          </Link>
        </div>
      </header>

      <dl className="placar" aria-label="Resumo da unidade">
        <div className="placar__item">
          <dt>Presentes</dt>
          <dd className="placa">{visao?.totalPresente ?? contagem.presentes}</dd>
        </div>
        <div className="placar__item">
          <dt>A caminho</dt>
          <dd className="placa">{visao?.totalACaminho ?? contagem.aCaminho}</dd>
        </div>
        <div className="placar__item">
          <dt>Em atendimento</dt>
          <dd className="placa">{contagem.emAtendimento}</dd>
        </div>
        <div className="placar__item">
          <dt>Espera média (2 h)</dt>
          <dd className="placa">{visao ? formatarDuracao(visao.tempoMedioEsperaMin) : '—'}</dd>
        </div>
        <div className="placar__item">
          <dt>Movimento</dt>
          <dd>{visao ? <Medidor nivel={visao.nivelCongestionamento} /> : <span className="suave">indisponível</span>}</dd>
        </div>
      </dl>

      {dados.meta.degraded && (
        <Alerta tipo="aviso">
          <p>
            Parte dos dados não respondeu:{' '}
            {dados.meta.falhas.map((f) => `${descreverFonte(f.fonte).rotulo} (${f.motivo})`).join(', ')}. A fila continua
            sendo atualizada.
          </p>
        </Alerta>
      )}
      {erro !== undefined && <AlertaErro erro={erro} mensagem="Não foi possível atualizar a fila agora. Mostrando os últimos dados recebidos." />}
      {fila.erroAcao !== undefined && <AlertaErro erro={fila.erroAcao} />}
      <p className="visualmente-oculto" role="status" aria-live="polite">
        {fila.mensagem}
      </p>
      {fila.mensagem && (
        <p className="fila__confirmacao" aria-hidden="true">
          <Icone nome="ok" /> {fila.mensagem}
        </p>
      )}

      {grupos.emAtendimento.length > 0 && (
        <section aria-labelledby="titulo-em-atendimento" className="pilha">
          <h2 id="titulo-em-atendimento" className="fila__secao">
            Em atendimento <span className="suave">({grupos.emAtendimento.length})</span>
          </h2>
          <TabelaFila
            registros={grupos.emAtendimento}
            agora={agora}
            unidadeId={unidadeId}
            podeOperar={podeOperar}
            fila={fila}
            legenda="Pacientes em atendimento"
          />
        </section>
      )}

      <section aria-labelledby="titulo-espera" className="pilha">
        <div className="fila__barra">
          <h2 id="titulo-espera" className="fila__secao">
            Aguardando por prioridade <span className="suave">({grupos.espera.length})</span>
          </h2>
          <fieldset className="segmentado">
            <legend className="visualmente-oculto">Mostrar</legend>
            {FILTROS.map((f) => (
              <label key={f.valor}>
                <input type="radio" name="filtro-fila" value={f.valor} checked={filtro === f.valor} onChange={() => setFiltro(f.valor)} />
                <span>{f.rotulo}</span>
              </label>
            ))}
          </fieldset>
        </div>
        {grupos.espera.length === 0 ? (
          <Vazio titulo={filtro === 'todos' ? 'Ninguém aguardando agora' : 'Ninguém nesta situação'}>
            <p>Quando um paciente avisar pelo app que está a caminho, ele aparece aqui sem recarregar a página.</p>
          </Vazio>
        ) : (
          <TabelaFila
            registros={grupos.espera}
            agora={agora}
            unidadeId={unidadeId}
            podeOperar={podeOperar}
            fila={fila}
            numerada
            legenda="Fila de espera ordenada por prioridade clínica"
          />
        )}
      </section>
    </div>
  );
}

interface TabelaProps {
  registros: RegistroFila[];
  agora: Date;
  unidadeId: string;
  podeOperar: boolean;
  fila: ReturnType<typeof useFila>;
  numerada?: boolean;
  legenda: string;
}

function TabelaFila({ registros, agora, unidadeId, podeOperar, fila, numerada, legenda }: TabelaProps) {
  return (
    <div className="rolagem-x">
      <table className="tabela fila__tabela">
        <caption className="visualmente-oculto">{legenda}</caption>
        <thead>
          <tr>
            <th scope="col">{numerada ? 'Pos.' : <span className="visualmente-oculto">Faixa</span>}</th>
            <th scope="col">Prioridade</th>
            <th scope="col">Paciente e sintomas</th>
            <th scope="col">Situação</th>
            <th scope="col">Prontuário</th>
            {podeOperar && <th scope="col">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {registros.map((r, i) => (
            <LinhaFila
              key={r.id}
              registro={r}
              posicao={numerada ? i + 1 : undefined}
              agora={agora}
              unidadeId={unidadeId}
              podeOperar={podeOperar}
              fila={fila}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ICONE_SITUACAO = { presente: 'presente', 'a-caminho': 'caminho', 'em-atendimento': 'atendimento' } as const;

interface LinhaProps {
  registro: RegistroFila;
  posicao?: number;
  agora: Date;
  unidadeId: string;
  podeOperar: boolean;
  fila: ReturnType<typeof useFila>;
}

function LinhaFila({ registro: r, posicao, agora, unidadeId, podeOperar, fila }: LinhaProps) {
  const s = situacao(r, agora);
  const acoes = acoesPermitidas(r.status);
  const nome = nomeExibicao(r);
  const ocupado = fila.emAndamento === r.id;
  const cor = infoPrioridade(r.prioridade).cor;

  return (
    <tr className={`fila__linha fila__linha--${s.tipo} cor-${cor}`} aria-busy={ocupado}>
      <td className="fila__faixa">{posicao && <span className="placa fila__posicao">{posicao}</span>}</td>
      <td>
        <Pulseira prioridade={r.prioridade} />
      </td>
      <td>
        <strong className="fila__nome">{nome}</strong>
        <span className="fila__sintomas">{r.sintomas.join(' · ')}</span>
      </td>
      <td>
        <span className={`situacao situacao--${s.tipo}`}>
          <Icone nome={ICONE_SITUACAO[s.tipo]} />
          <span>
            <strong>{s.rotulo}</strong>
            <span className="situacao__detalhe dado">{s.detalhe}</span>
          </span>
        </span>
      </td>
      <td>
        <Autorizacao registro={r} unidadeId={unidadeId} podeAbrir={podeOperar} />
      </td>
      {podeOperar && (
        <td>
          <div className="linha-acoes fila__acoes">
            {acoes.confirmarChegada && (
              <button type="button" className="btn btn--primario btn--compacto" disabled={ocupado} onClick={() => fila.confirmarChegada(r)} aria-label={`Confirmar chegada de ${nome}`}>
                Confirmar chegada
              </button>
            )}
            {acoes.iniciarAtendimento && (
              <button type="button" className="btn btn--primario btn--compacto" disabled={ocupado} onClick={() => fila.iniciarAtendimento(r)} aria-label={`Iniciar atendimento de ${nome}`}>
                Iniciar atendimento
              </button>
            )}
            {acoes.alterarPrioridade && (
              <select
                className="fila__prioridade"
                aria-label={`Prioridade de ${nome}`}
                value={r.prioridade}
                disabled={ocupado}
                onChange={(e) => fila.alterarPrioridade(r, e.target.value as Prioridade)}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {infoPrioridade(p).rotulo}
                  </option>
                ))}
              </select>
            )}
            {acoes.encerrarCom.map((m) => (
              <button
                key={m}
                type="button"
                className={`btn btn--compacto${m === 'ATENDIDO' ? ' btn--primario' : ' btn--perigo'}`}
                disabled={ocupado}
                onClick={() => fila.encerrar(r, m)}
                aria-label={`${rotuloMotivo(m)} — ${nome}`}
              >
                {rotuloMotivo(m)}
              </button>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}

function Autorizacao({ registro, unidadeId, podeAbrir }: { registro: RegistroFila; unidadeId: string; podeAbrir: boolean }) {
  if (registro.prontuarioAutorizado === null || registro.prontuarioAutorizado === undefined) {
    return <span className="etiqueta etiqueta--neutra">Indisponível</span>;
  }
  if (!registro.prontuarioAutorizado) {
    return (
      <span className="etiqueta etiqueta--neutra">
        <Icone nome="cadeadoAberto" tamanho={14} /> Sem autorização
      </span>
    );
  }
  return (
    <span className="fila__autorizado">
      <span className="etiqueta etiqueta--ok">
        <Icone nome="cadeado" tamanho={14} /> Autorizado
      </span>
      {podeAbrir && (
        <Link
          to={`/atendimento/${encodeURIComponent(unidadeId)}/prontuario/${encodeURIComponent(registro.pacienteId)}`}
          state={{ nome: nomeExibicao(registro) }}
          aria-label={`Ver prontuário de ${nomeExibicao(registro)}`}
        >
          Ver prontuário
        </Link>
      )}
    </span>
  );
}
