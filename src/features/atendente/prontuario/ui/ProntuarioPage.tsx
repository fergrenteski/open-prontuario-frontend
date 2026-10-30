import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useSessao } from '../../../../shared/application/sessao';
import { temPerfil } from '../../../../shared/domain/perfis';
import { Alerta, AlertaErro, Carregando } from '../../../../shared/ui/Estados';
import { FichaProntuario } from '../../../../shared/ui/FichaProntuario';
import { Icone } from '../../../../shared/ui/Icone';
import type { ProntuarioPort } from '../application/ports';
import { useProntuario } from '../application/useProntuario';
import { DESCRICAO_MAX, type MotivoBloqueio } from '../domain/prontuario';
import './prontuario.css';

const BLOQUEIOS: Record<MotivoBloqueio, { titulo: string; texto: string }> = {
  'sem-consentimento': {
    titulo: 'O paciente não autorizou esta unidade',
    texto:
      'Não há autorização válida do paciente para compartilhar o prontuário com esta unidade (ausente, expirada ou revogada). Ele pode autorizar pelo app, em “Autorizações”, ou ao avisar a chegada. Nenhum dado clínico foi exibido.',
  },
  'sem-lotacao': {
    titulo: 'Você não está lotado nesta unidade',
    texto: 'O acesso ao prontuário só vale para profissionais lotados na unidade do atendimento. Fale com o gestor.',
  },
  'auditoria-indisponivel': {
    titulo: 'Acesso bloqueado por segurança',
    texto:
      'O registro de auditoria deste acesso não pôde ser gravado agora, então o prontuário não foi exibido. Tente de novo em instantes.',
  },
  'sem-prontuario': {
    titulo: 'Paciente sem prontuário cadastrado',
    texto: 'Este paciente ainda não tem prontuário no sistema.',
  },
};

export function ProntuarioPage({ porta }: { porta: ProntuarioPort }) {
  const { unidadeId = '', pacienteId = '' } = useParams();
  const nome = (useLocation().state as { nome?: string } | null)?.nome ?? `Paciente ${pacienteId}`;
  const { sessao } = useSessao();
  const { prontuario, bloqueio, registrar } = useProntuario(porta, pacienteId, unidadeId);
  const [descricao, setDescricao] = useState('');
  const [registrado, setRegistrado] = useState(false);
  const profissional = temPerfil(sessao?.usuario, 'PROFISSIONAL');

  async function aoRegistrar(e: FormEvent) {
    e.preventDefault();
    setRegistrado(false);
    if (await registrar.executar(descricao)) {
      setDescricao('');
      setRegistrado(true);
    }
  }

  return (
    <div className="pront pilha">
      <Link to={`/atendimento/${encodeURIComponent(unidadeId)}/fila`} className="pront__voltar">
        ← Voltar à fila
      </Link>
      <header>
        <p className="sobretitulo">Prontuário compartilhado · {unidadeId}</p>
        <h1 className="placa pront__nome">{nome}</h1>
        <p className="dado suave">{pacienteId}</p>
      </header>

      {prontuario.carregando && <Carregando texto="Verificando autorização e abrindo o prontuário…" />}

      {bloqueio && (
        <section className="pront__bloqueio" role="alert" aria-labelledby="titulo-bloqueio">
          <Icone nome="cadeado" tamanho={32} />
          <div className="pilha">
            <h2 id="titulo-bloqueio">{BLOQUEIOS[bloqueio].titulo}</h2>
            <p>{BLOQUEIOS[bloqueio].texto}</p>
            {bloqueio === 'auditoria-indisponivel' && (
              <div>
                <button type="button" className="btn btn--compacto" onClick={prontuario.recarregar}>
                  Tentar de novo
                </button>
              </div>
            )}
          </div>
        </section>
      )}
      {prontuario.erro !== undefined && !bloqueio && <AlertaErro erro={prontuario.erro} aoTentarDeNovo={prontuario.recarregar} />}

      {prontuario.dados && (
        <>
          <p className="pront__auditado">
            <Icone nome="escudo" /> Acesso autorizado pelo paciente e registrado no histórico de acessos dele.
          </p>
          <FichaProntuario prontuario={prontuario.dados} />

          {profissional && (
            <form className="ficha pront__form pilha" onSubmit={aoRegistrar} noValidate>
              <h2>Registrar atendimento</h2>
              <div className="campo">
                <label htmlFor="descricao">Descrição do atendimento</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={descricao}
                  maxLength={DESCRICAO_MAX}
                  onChange={(e) => setDescricao(e.target.value)}
                  aria-describedby="ajuda-descricao"
                  aria-invalid={registrar.erro !== undefined}
                />
                <span id="ajuda-descricao" className="ajuda">
                  Fica no histórico do paciente com a unidade {unidadeId}. {descricao.length}/{DESCRICAO_MAX}
                </span>
              </div>
              {registrar.erro !== undefined && (
                <AlertaErro erro={registrar.erro} />
              )}
              {registrado && <Alerta tipo="sucesso">Atendimento registrado no prontuário.</Alerta>}
              <div>
                <button type="submit" className="btn btn--primario" disabled={registrar.pendente}>
                  {registrar.pendente ? 'Registrando…' : 'Registrar atendimento'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
