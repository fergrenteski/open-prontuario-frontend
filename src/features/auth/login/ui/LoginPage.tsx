import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PRIORIDADES } from '../../../../shared/domain/prioridade';
import { rotuloPerfil } from '../../../../shared/domain/perfis';
import { AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import { Pulseira } from '../../../../shared/ui/Pulseira';
import { Marca } from '../../../../shared/ui/Shells';
import type { AutenticacaoPort } from '../application/ports';
import { useLogin } from '../application/useLogin';
import { agruparPersonas, iniciais } from '../domain/login';
import './login.css';

export function LoginPage({ porta }: { porta: AutenticacaoPort }) {
  const navegar = useNavigate();
  const { personas, entrar } = useLogin(porta);
  const [escolhida, setEscolhida] = useState<string>();

  async function aoEntrar(usuarioId?: string) {
    setEscolhida(usuarioId);
    const rota = await entrar.executar(usuarioId);
    if (rota) navegar(rota, { replace: true });
  }

  return (
    <div className="login">
      <section className="login__tese" aria-labelledby="tese">
        <Marca />
        <h1 id="tese" className="placa login__titulo">
          Fila por risco,
          <br />
          não por ordem de chegada.
        </h1>
        <p className="login__sub">
          A UPA sabe quem está a caminho e com quais sintomas antes da chegada. O prontuário só é aberto para a
          unidade que o paciente autorizar, pelo prazo que ele escolher.
        </p>
        <ul className="login__pulseiras" aria-label="Níveis de prioridade usados na fila">
          {PRIORIDADES.map((p) => (
            <li key={p}>
              <Pulseira prioridade={p} grande comTempo />
            </li>
          ))}
        </ul>
      </section>

      <section className="login__cartao ficha" aria-labelledby="entrar">
        <h2 id="entrar" className="login__cartao-titulo">
          Entrar
        </h2>

        {porta.modo === 'entra' ? (
          <div className="pilha">
            <p className="suave">Use a sua conta institucional. Seu perfil (paciente, atendente, profissional ou gestor) vem do Entra ID.</p>
            <button type="button" className="btn btn--primario btn--largo" disabled={entrar.pendente} onClick={() => aoEntrar()}>
              {entrar.pendente ? 'Abrindo login da Microsoft…' : 'Entrar com conta Microsoft'}
            </button>
          </div>
        ) : (
          <div className="pilha">
            <p className="suave">
              Ambiente de demonstração: escolha uma pessoa para entrar com o perfil dela.
            </p>
            {personas.carregando && <Carregando texto="Buscando personas…" />}
            {personas.erro !== undefined && <AlertaErro erro={personas.erro} aoTentarDeNovo={personas.recarregar} />}
            {personas.dados?.length === 0 && (
              <Vazio titulo="Nenhuma persona disponível">
                <p>O BFF não está em modo de demonstração (AUTH_MODE=dev).</p>
              </Vazio>
            )}
            {personas.dados &&
              agruparPersonas(personas.dados).map((grupo, i) => (
                <div key={grupo.titulo} className="login__grupo" role="group" aria-labelledby={`grupo-personas-${i}`}>
                  <h3 id={`grupo-personas-${i}`} className="sobretitulo">
                    {grupo.titulo}
                  </h3>
                  {grupo.personas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="persona"
                      disabled={entrar.pendente}
                      aria-busy={entrar.pendente && escolhida === p.id}
                      onClick={() => aoEntrar(p.id)}
                    >
                      <span className="persona__avatar" aria-hidden="true">
                        {iniciais(p.nome)}
                      </span>
                      <span className="persona__texto">
                        <strong>{p.nome}</strong>
                        <span className="suave">{p.roles.map(rotuloPerfil).join(', ')}</span>
                      </span>
                      <span className="persona__id dado" translate="no">{p.id}</span>
                      <Icone nome="seta" className="persona__seta" />
                    </button>
                  ))}
                </div>
              ))}
          </div>
        )}
        {entrar.erro !== undefined && <AlertaErro erro={entrar.erro} />}
      </section>
    </div>
  );
}
