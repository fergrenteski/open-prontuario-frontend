import { useSearchParams } from 'react-router';
import { descreverFonte } from '../../../../shared/domain/agregacao';
import { formatarDataHora, formatarDuracao } from '../../../../shared/domain/datas';
import { infoPrioridade } from '../../../../shared/domain/prioridade';
import { Alerta, AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import { Medidor } from '../../../../shared/ui/Medidor';
import { Pulseira } from '../../../../shared/ui/Pulseira';
import { SeletorUnidade } from '../../../../shared/ui/SeletorUnidade';
import type { IndicadoresPort } from '../application/ports';
import { INTERVALO_INDICADORES_MS, useIndicadores } from '../application/useIndicadores';
import { CAMPOS_POR_FONTE, distribuicaoPrioridade, estadoDasFontes, taxaAutorizacao } from '../domain/indicadores';
import './indicadores.css';

const ROTULO_STATUS = { ok: 'respondeu', falha: 'falhou', 'sem-resposta': 'sem resposta' } as const;

export function IndicadoresPage({ porta }: { porta: IndicadoresPort }) {
  const [params, setParams] = useSearchParams();
  const { unidades, unidadeAtual, agregado } = useIndicadores(porta, params.get('unidadeId'));
  const dados = agregado.dados;

  return (
    <div className="indic pilha">
      <header className="indic__cabecalho">
        <div>
          <p className="sobretitulo">Indicadores da unidade</p>
          <h1 className="placa indic__titulo">{dados?.unidade?.nome ?? 'Indicadores'}</h1>
        </div>
        <div className="indic__controles">
          {unidades.dados && unidades.dados.length > 0 && (
            <SeletorUnidade unidades={unidades.dados} valor={unidadeAtual} aoMudar={(id) => setParams({ unidadeId: id })} />
          )}
          <button type="button" className="btn" onClick={agregado.recarregar} disabled={!unidadeAtual}>
            <Icone nome="atualizar" /> Atualizar agora
          </button>
        </div>
      </header>

      {(unidades.carregando || (unidadeAtual && agregado.carregando)) && <Carregando texto="Agregando dados das três fontes…" />}
      {unidades.erro !== undefined && <AlertaErro erro={unidades.erro} aoTentarDeNovo={unidades.recarregar} />}
      {unidades.dados?.length === 0 && (
        <Vazio titulo="Você não está lotado como gestor em nenhuma unidade">
          <p>Cadastre a sua lotação em “Lotações”.</p>
        </Vazio>
      )}
      {agregado.erro !== undefined && <AlertaErro erro={agregado.erro} aoTentarDeNovo={agregado.recarregar} />}

      {dados && (
        <>
          <section className="indic__origem" aria-labelledby="titulo-origem">
            <div className="indic__origem-cabeca">
              <h2 id="titulo-origem" className="indic__secao">
                Uma chamada, três fontes
              </h2>
              <p className="dado indic__requisicao" translate="no">GET /api/aggregated-data?unidadeId={unidadeAtual}</p>
              <p className="suave indic__meta">
                Gerado em <span className="dado">{formatarDataHora(dados.meta.geradoEm)}</span> · correlationId{' '}
                <span className="dado">{dados.meta.correlationId}</span> · atualiza a cada {INTERVALO_INDICADORES_MS / 1000} s
              </p>
            </div>
            {dados.meta.degraded ? (
              <Alerta tipo="aviso">
                <p>
                  <strong>Resposta degradada.</strong> O BFF respondeu com o que estava disponível; as fontes com falha vieram vazias.
                </p>
              </Alerta>
            ) : (
              <p className="indic__integra">
                <Icone nome="ok" /> Resposta completa: todas as fontes responderam.
              </p>
            )}
            <ul className="indic__fontes">
              {estadoDasFontes(dados.meta).map((f) => {
                const d = descreverFonte(f.nome);
                return (
                  <li key={f.nome} className={`indic__fonte indic__fonte--${f.status}`}>
                    <Icone nome={f.nome.startsWith('fn-') ? 'raio' : 'banco'} tamanho={22} />
                    <div className="indic__fonte-texto">
                      <strong>{d.rotulo}</strong>
                      <span className="suave">{d.tecnologia}</span>
                      <span className="indic__campos">{CAMPOS_POR_FONTE[f.nome]}</span>
                    </div>
                    <div className="indic__fonte-status">
                      <span className={`etiqueta ${f.status === 'ok' ? 'etiqueta--ok' : 'etiqueta--perigo'}`}>
                        <Icone nome={f.status === 'ok' ? 'ok' : 'alerta'} tamanho={14} /> {ROTULO_STATUS[f.status]}
                      </span>
                      <span className="dado">{f.duracaoMs === null ? '—' : `${f.duracaoMs} ms`}</span>
                      {f.motivo && <span className="indic__motivo">{f.motivo}</span>}
                    </div>
                    <span className="indic__barra" style={{ inlineSize: `${f.proporcao}%` }} aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
            {dados.meta.avisos.length > 0 && (
              <ul className="indic__avisos">
                {dados.meta.avisos.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-kpis" className="pilha">
            <h2 id="titulo-kpis" className="indic__secao">
              Agora na unidade
            </h2>
            {dados.visaoAgregada ? (
              <dl className="indic__kpis">
                <div>
                  <dt>Presentes</dt>
                  <dd className="placa">{dados.visaoAgregada.totalPresente}</dd>
                </div>
                <div>
                  <dt>A caminho</dt>
                  <dd className="placa">{dados.visaoAgregada.totalACaminho}</dd>
                </div>
                <div>
                  <dt>Espera média (2 h)</dt>
                  <dd className="placa">{formatarDuracao(dados.visaoAgregada.tempoMedioEsperaMin)}</dd>
                </div>
                <div>
                  <dt>Congestionamento</dt>
                  <dd>
                    <Medidor nivel={dados.visaoAgregada.nivelCongestionamento} />
                  </dd>
                </div>
              </dl>
            ) : (
              <Vazio titulo="Visão agregada indisponível">
                <p>A Function não respondeu; os demais dados seguem abaixo.</p>
              </Vazio>
            )}
          </section>

          {dados.fila && (
            <section aria-labelledby="titulo-dist" className="ficha indic__dist pilha">
              <h2 id="titulo-dist" className="indic__secao">
                Fila ativa por prioridade
              </h2>
              <ul className="indic__niveis">
                {distribuicaoPrioridade(dados.fila).map(({ prioridade, total }) => (
                  <li key={prioridade} className={`cor-${infoPrioridade(prioridade).cor}`}>
                    <Pulseira prioridade={prioridade} />
                    <span className="indic__nivel-barra" style={{ inlineSize: `${Math.min(100, total * 12)}%` }} aria-hidden="true" />
                    <span className="dado indic__nivel-total">{total}</span>
                  </li>
                ))}
              </ul>
              {taxaAutorizacao(dados.fila) !== null && (
                <p className="suave">
                  {taxaAutorizacao(dados.fila)}% dos pacientes na fila autorizaram o prontuário para esta unidade.
                </p>
              )}
            </section>
          )}

          <details className="indic__json">
            <summary>Ver o JSON único devolvido pelo BFF</summary>
            <pre className="dado">{JSON.stringify(dados, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  );
}
