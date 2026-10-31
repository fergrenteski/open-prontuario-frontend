import { useState, type FormEvent } from 'react';
import { formatarDataHora } from '../../../../shared/domain/datas';
import { nomesDeUnidades } from '../../../../shared/domain/tipos';
import { Alerta, AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import type { ConsentimentosPort } from '../application/ports';
import { useConsentimentos } from '../application/useConsentimentos';
import {
  VALIDADE_MAX,
  VALIDADE_MIN,
  VALIDADE_PADRAO,
  agruparConsentimentos,
  diasRestantes,
  unidadesSemAutorizacao,
  type Consentimento,
} from '../domain/consentimento';
import './consentimentos.css';

export function ConsentimentosPage({ porta }: { porta: ConsentimentosPort }) {
  const c = useConsentimentos(porta);
  const [agora] = useState(() => new Date());
  const { dados } = c.dados;

  if (c.dados.carregando) return <Carregando texto="Carregando suas autorizações…" />;
  if (!dados) return <AlertaErro erro={c.dados.erro} aoTentarDeNovo={c.dados.recarregar} />;

  const nome = nomesDeUnidades(dados.unidades);
  const grupos = agruparConsentimentos(dados.consentimentos, agora);
  const disponiveis = unidadesSemAutorizacao(dados.unidades, dados.consentimentos, agora);

  return (
    <div className="consent pilha">
      <header>
        <h1 className="placa consent__titulo">Quem pode ver seu prontuário</h1>
        <p className="suave">
          Cada autorização vale para uma unidade e por um prazo. Você pode revogar a qualquer momento, com efeito imediato.
        </p>
      </header>

      {c.mensagem && <Alerta tipo="sucesso">{c.mensagem}</Alerta>}
      {c.acao.erro !== undefined && <AlertaErro erro={c.acao.erro} />}

      <section aria-labelledby="titulo-ativas" className="pilha">
        <h2 id="titulo-ativas" className="consent__secao">
          Ativas <span className="suave">({grupos.ATIVO.length})</span>
        </h2>
        {grupos.ATIVO.length === 0 ? (
          <Vazio titulo="Nenhuma unidade vê seu prontuário agora">
            <p>Autorize abaixo, ou ao avisar que está a caminho de uma unidade.</p>
          </Vazio>
        ) : (
          <ul className="consent__lista">
            {grupos.ATIVO.map((x) => (
              <ConsentimentoAtivo key={x.id} consentimento={x} nomeUnidade={nome(x.unidadeId)} agora={agora} ocupado={c.acao.pendente} aoRenovar={c.renovar} aoRevogar={c.revogar} />
            ))}
          </ul>
        )}
      </section>

      <NovaAutorizacao unidades={disponiveis} ocupado={c.acao.pendente} aoConceder={c.conceder} />

      {(grupos.EXPIRADO.length > 0 || grupos.REVOGADO.length > 0) && (
        <section aria-labelledby="titulo-historico" className="pilha">
          <h2 id="titulo-historico" className="consent__secao">
            Histórico de autorizações
          </h2>
          <ul className="consent__historico">
            {[...grupos.REVOGADO, ...grupos.EXPIRADO].map((x) => {
              const revogada = grupos.REVOGADO.includes(x);
              return (
                <li key={x.id}>
                  <span className={`etiqueta ${revogada ? 'etiqueta--perigo' : 'etiqueta--neutra'}`}>{revogada ? 'Revogada' : 'Expirada'}</span>
                  <strong>{nome(x.unidadeId)}</strong>
                  <span className="suave dado">
                    {revogada && x.revogadoEm ? `revogada em ${formatarDataHora(x.revogadoEm)}` : `venceu em ${formatarDataHora(x.expiraEm)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

interface AtivoProps {
  consentimento: Consentimento;
  nomeUnidade: string;
  agora: Date;
  ocupado: boolean;
  aoRenovar: (id: string, dias: number) => unknown;
  aoRevogar: (id: string) => unknown;
}

function ConsentimentoAtivo({ consentimento: x, nomeUnidade, agora, ocupado, aoRenovar, aoRevogar }: AtivoProps) {
  const [dias, setDias] = useState(String(VALIDADE_PADRAO));
  const [confirmando, setConfirmando] = useState(false);
  const restantes = diasRestantes(x, agora);
  const idDias = `dias-${x.id}`;

  return (
    <li className="ficha consent__cartao">
      <div className="consent__cabeca">
        <Icone nome="cadeado" />
        <div>
          <strong className="consent__unidade">{nomeUnidade}</strong>
          <p className="suave">
            até <span className="dado">{formatarDataHora(x.expiraEm)}</span> · {restantes === 1 ? 'falta 1 dia' : `faltam ${restantes} dias`}
          </p>
        </div>
      </div>
      <div className="consent__acoes">
        <div className="consent__renovar">
          <label htmlFor={idDias}>Renovar por</label>
          <input id={idDias} type="number" inputMode="numeric" min={VALIDADE_MIN} max={VALIDADE_MAX} value={dias} onChange={(e) => setDias(e.target.value)} />
          <span aria-hidden="true">dias</span>
          <button type="button" className="btn btn--compacto" disabled={ocupado} onClick={() => aoRenovar(x.id, Number(dias))} aria-label={`Renovar autorização de ${nomeUnidade} por ${dias} dias`}>
            Renovar
          </button>
        </div>
        {confirmando ? (
          <div className="linha-acoes" role="group" aria-label={`Confirmar revogação para ${nomeUnidade}`}>
            <button type="button" className="btn btn--compacto btn--perigo" disabled={ocupado} onClick={() => aoRevogar(x.id)}>
              Confirmar revogação
            </button>
            <button type="button" className="btn btn--compacto" onClick={() => setConfirmando(false)}>
              Manter
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--compacto btn--perigo" onClick={() => setConfirmando(true)} aria-label={`Revogar autorização de ${nomeUnidade}`}>
            Revogar
          </button>
        )}
      </div>
    </li>
  );
}

interface NovaProps {
  unidades: { id: string; nome: string }[];
  ocupado: boolean;
  aoConceder: (unidadeId: string, dias: number) => Promise<unknown>;
}

function NovaAutorizacao({ unidades, ocupado, aoConceder }: NovaProps) {
  const [unidadeId, setUnidadeId] = useState('');
  const [dias, setDias] = useState(String(VALIDADE_PADRAO));
  const escolhida = unidades.some((u) => u.id === unidadeId) ? unidadeId : (unidades[0]?.id ?? '');

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (escolhida) await aoConceder(escolhida, Number(dias));
  }

  return (
    <section aria-labelledby="titulo-nova" className="ficha consent__nova">
      <h2 id="titulo-nova" className="consent__secao">
        Autorizar uma unidade
      </h2>
      {unidades.length === 0 ? (
        <p className="suave">Todas as unidades já têm autorização válida.</p>
      ) : (
        <form className="consent__form" onSubmit={aoEnviar}>
          <div className="campo">
            <label htmlFor="nova-unidade">Unidade</label>
            <select id="nova-unidade" name="nova-unidade" value={escolhida} onChange={(e) => setUnidadeId(e.target.value)}>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="nova-dias">Validade (dias)</label>
            <input id="nova-dias" name="nova-dias" type="number" inputMode="numeric" min={VALIDADE_MIN} max={VALIDADE_MAX} value={dias} onChange={(e) => setDias(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--primario" disabled={ocupado}>
            Autorizar
          </button>
        </form>
      )}
    </section>
  );
}
