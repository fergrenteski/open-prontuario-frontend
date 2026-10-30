import { formatarDataHora } from '../../../../shared/domain/datas';
import { temCodigo } from '../../../../shared/domain/erros';
import { nomesDeUnidades } from '../../../../shared/domain/tipos';
import { AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { FichaProntuario } from '../../../../shared/ui/FichaProntuario';
import type { MeuProntuarioPort } from '../application/ports';
import { useMeuProntuario } from '../application/useMeuProntuario';
import { unidadesQueAcessaram } from '../domain/meuProntuario';
import './meu-prontuario.css';

export function MeuProntuarioPage({ porta }: { porta: MeuProntuarioPort }) {
  const consulta = useMeuProntuario(porta);
  const { dados, erro } = consulta;

  return (
    <div className="meu pilha">
      <header>
        <h1 className="placa meu__titulo">Meu prontuário</h1>
        <p className="suave">O que as unidades autorizadas por você podem ver.</p>
      </header>

      {consulta.carregando && <Carregando texto="Abrindo seu prontuário…" />}
      {temCodigo(erro, 'RECURSO_NAO_ENCONTRADO') ? (
        <Vazio titulo="Você ainda não tem prontuário">
          <p>Ele é criado pela unidade de saúde no seu primeiro atendimento.</p>
        </Vazio>
      ) : (
        erro !== undefined && <AlertaErro erro={erro} aoTentarDeNovo={consulta.recarregar} />
      )}

      {dados && (
        <>
          <FichaProntuario prontuario={dados.prontuario} nomeUnidade={nomesDeUnidades(dados.unidades)} />

          <section className="ficha meu__acessos pilha" aria-labelledby="titulo-acessos">
            <div>
              <h2 id="titulo-acessos" className="meu__secao">
                Quem acessou
              </h2>
              <p className="suave">
                Todo acesso de um profissional fica registrado e não pode ser apagado.
                {dados.acessos.length > 0 &&
                  ` ${dados.acessos.length} ${dados.acessos.length === 1 ? 'acesso' : 'acessos'} de ${unidadesQueAcessaram(dados.acessos)} ${unidadesQueAcessaram(dados.acessos) === 1 ? 'unidade' : 'unidades'}.`}
              </p>
            </div>
            {dados.acessos.length === 0 ? (
              <p className="meu__nenhum">Ninguém acessou seu prontuário até agora.</p>
            ) : (
              <ol className="meu__lista">
                {dados.acessos.map((a) => (
                  <li key={a.id}>
                    <time className="dado" dateTime={a.acessadoEm}>
                      {formatarDataHora(a.acessadoEm)}
                    </time>
                    <span>
                      <strong>{nomesDeUnidades(dados.unidades)(a.unidadeId)}</strong>
                      <span className="suave"> · profissional </span>
                      <span className="dado">{a.usuarioId}</span>
                    </span>
                    <span className="meu__consent dado">autorização {a.consentimentoId}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
