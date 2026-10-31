import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { formatarHora } from '../../../../shared/domain/datas';
import { AlertaErro, Alerta, Carregando } from '../../../../shared/ui/Estados';
import { focarPrimeiroInvalido } from '../../../../shared/ui/foco';
import { Icone } from '../../../../shared/ui/Icone';
import { Pulseira } from '../../../../shared/ui/Pulseira';
import type { AvisoChegadaPort } from '../application/ports';
import { useAvisoChegada } from '../application/useAvisoChegada';
import { SINTOMAS_COMUNS, VALIDADE_PADRAO_DIAS, type RegistroAviso } from '../domain/aviso';
import './aviso.css';

export function AvisoChegadaPage({ porta }: { porta: AvisoChegadaPort }) {
  const { unidadeId = '' } = useParams();
  const { unidade, errosCampos, enviar } = useAvisoChegada(porta, unidadeId);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [outros, setOutros] = useState('');
  const [minutos, setMinutos] = useState('');
  const [autorizar, setAutorizar] = useState(false);
  const [validade, setValidade] = useState(String(VALIDADE_PADRAO_DIAS));
  const [registro, setRegistro] = useState<RegistroAviso>();
  const nomeUnidade = unidade.dados?.nome ?? 'a unidade';

  function alternar(s: string) {
    setMarcados((atual) => (atual.includes(s) ? atual.filter((x) => x !== s) : [...atual, s]));
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const formulario = e.currentTarget as HTMLFormElement;
    const r = await enviar.executar({
      sintomas: [...marcados, ...outros.split(',')],
      tempoEstimadoChegadaMin: minutos === '' ? undefined : Number(minutos),
      autorizarProntuario: autorizar,
      validadeConsentimentoDias: Number(validade),
    });
    if (r) setRegistro(r);
    else focarPrimeiroInvalido(formulario);
  }

  if (registro) return <Confirmacao registro={registro} nomeUnidade={nomeUnidade} />;

  return (
    <div className="aviso pilha">
      <Link to="/paciente/unidades" className="aviso__voltar">
        ← Unidades
      </Link>
      <header>
        <p className="sobretitulo">Aviso de chegada</p>
        <h1 className="placa aviso__titulo">{unidade.dados?.nome ?? (unidade.carregando ? '…' : unidadeId)}</h1>
        <p className="suave">A equipe vê seu aviso antes de você chegar e organiza a fila pela gravidade.</p>
      </header>
      {unidade.carregando && <Carregando texto="Carregando a unidade…" />}
      {unidade.erro !== undefined && <AlertaErro erro={unidade.erro} aoTentarDeNovo={unidade.recarregar} />}

      <form className="pilha" onSubmit={aoEnviar} noValidate>
        <fieldset
          className="aviso__grupo"
          aria-describedby={errosCampos.sintomas ? 'erro-sintomas' : undefined}
          data-invalido={errosCampos.sintomas ? '' : undefined}
        >
          <legend>O que você está sentindo?</legend>
          <div className="chips">
            {SINTOMAS_COMUNS.map((s) => (
              <label key={s} className="chip">
                <input type="checkbox" checked={marcados.includes(s)} onChange={() => alternar(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
          <div className="campo">
            <label htmlFor="outros">Outros sintomas</label>
            <input id="outros" name="outros" type="text" value={outros} onChange={(e) => setOutros(e.target.value)} autoComplete="off" />
            <span className="ajuda">Separe por vírgula. Ex.: dor nas costas, enjoo</span>
          </div>
          {errosCampos.sintomas && (
            <p id="erro-sintomas" className="erro-campo">
              {errosCampos.sintomas}
            </p>
          )}
        </fieldset>

        <div className="campo aviso__grupo">
          <label htmlFor="minutos">Em quantos minutos você chega?</label>
          <input
            id="minutos"
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            aria-invalid={!!errosCampos.tempoEstimadoChegadaMin}
            aria-describedby="ajuda-minutos"
          />
          <span id="ajuda-minutos" className={errosCampos.tempoEstimadoChegadaMin ? 'erro-campo' : 'ajuda'}>
            {errosCampos.tempoEstimadoChegadaMin ?? 'Opcional. Ajuda a recepção a se preparar.'}
          </span>
        </div>

        <div className="aviso__grupo aviso__consentimento">
          <label className="caixa-marcacao">
            <input type="checkbox" checked={autorizar} onChange={(e) => setAutorizar(e.target.checked)} />
            <span>
              <strong>Autorizar meu prontuário para esta unidade</strong>
              <span className="ajuda">
                A equipe poderá ver suas alergias, medicações e atendimentos anteriores. Cada acesso fica registrado e
                você pode revogar quando quiser em “Autorizações”.
              </span>
            </span>
          </label>
          {autorizar && (
            <div className="campo">
              <label htmlFor="validade">Por quantos dias?</label>
              <input
                id="validade"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                aria-invalid={!!errosCampos.validadeConsentimentoDias}
                aria-describedby="ajuda-validade"
              />
              <span id="ajuda-validade" className={errosCampos.validadeConsentimentoDias ? 'erro-campo' : 'ajuda'}>
                {errosCampos.validadeConsentimentoDias ?? 'De 1 a 365 dias. Padrão: 3 dias.'}
              </span>
            </div>
          )}
        </div>

        {enviar.erro !== undefined && <AlertaErro erro={enviar.erro} />}
        <button type="submit" className="btn btn--primario btn--largo aviso__enviar" disabled={enviar.pendente}>
          {enviar.pendente ? 'Avisando…' : `Avisar ${nomeUnidade}`}
        </button>
      </form>
    </div>
  );
}

function Confirmacao({ registro, nomeUnidade }: { registro: RegistroAviso; nomeUnidade: string }) {
  return (
    <section className="aviso pilha" aria-labelledby="titulo-confirmacao">
      <div className="aviso__ok">
        <Icone nome="ok" tamanho={40} />
        <h1 id="titulo-confirmacao" className="placa aviso__titulo">
          {nomeUnidade} já sabe que você está a caminho
        </h1>
        <p className="suave">
          Aviso feito às <span className="dado">{formatarHora(registro.horarioAviso)}</span>
          {registro.tempoEstimadoChegadaMin != null && <> · chegada prevista em {registro.tempoEstimadoChegadaMin} min</>}.
        </p>
      </div>
      <div className="ficha aviso__resumo pilha">
        <p className="sobretitulo">Classificação preliminar</p>
        <Pulseira prioridade={registro.prioridade} grande comTempo />
        <p className="ajuda">Calculada pelos sintomas informados. A equipe confirma na triagem quando você chegar.</p>
        <p>
          <strong>Sintomas:</strong> {registro.sintomas.join(', ')}
        </p>
        <p className="aviso__autorizacao">
          <Icone nome={registro.prontuarioAutorizado ? 'cadeado' : 'cadeadoAberto'} />
          {registro.prontuarioAutorizado ? 'Prontuário autorizado para esta unidade.' : 'Prontuário não compartilhado.'}
        </p>
      </div>
      {registro.avisos?.map((a) => (
        <Alerta key={a} tipo="aviso">
          {a}
        </Alerta>
      ))}
      <p>Ao chegar, procure a recepção. Se piorar no caminho, ligue <a href="tel:192">192 (SAMU)</a>.</p>
      <div className="linha-acoes">
        <Link to="/paciente/consentimentos" className="btn">
          Ver autorizações
        </Link>
        <Link to="/paciente/unidades" className="btn">
          Voltar às unidades
        </Link>
      </div>
    </section>
  );
}
