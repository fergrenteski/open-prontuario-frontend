import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { rotuloPerfil } from '../domain/perfis';
import type { Usuario } from '../domain/tipos';
import { Icone, type NomeIcone } from './Icone';
import './shells.css';

export function Marca({ invertida }: { invertida?: boolean }) {
  return (
    <span className={`marca${invertida ? ' marca--invertida' : ''}`}>
      <span className="marca__faixa" aria-hidden="true" />
      <span className="placa" translate="no">
        Open Prontuário
      </span>
    </span>
  );
}

export interface ItemNavegacao {
  para: string;
  rotulo: string;
  icone: NomeIcone;
}

interface ShellPainelProps {
  usuario: Usuario;
  aoSair: () => void;
  navegacao: ItemNavegacao[];
  children: ReactNode;
}

/** Painel do atendente/gestor: desktop-first, denso. */
export function ShellPainel({ usuario, aoSair, navegacao, children }: ShellPainelProps) {
  return (
    <div className="painel">
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="painel__topo">
        <Marca invertida />
        <nav aria-label="Áreas do painel" className="painel__nav">
          {navegacao.map((item) => (
            <NavLink key={item.para} to={item.para} className="painel__link">
              <Icone nome={item.icone} />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="painel__usuario">
          <span>
            <strong>{usuario.nome}</strong>
            <span className="painel__perfil">{usuario.roles.map(rotuloPerfil).join(', ')}</span>
          </span>
          <button type="button" className="btn btn--compacto painel__sair" onClick={aoSair}>
            <Icone nome="sair" />
            Sair
          </button>
        </div>
      </header>
      <main id="conteudo" className="painel__conteudo" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

const NAV_PACIENTE: ItemNavegacao[] = [
  { para: '/paciente/unidades', rotulo: 'Unidades', icone: 'local' },
  { para: '/paciente/consentimentos', rotulo: 'Autorizações', icone: 'escudo' },
  { para: '/paciente/prontuario', rotulo: 'Meu prontuário', icone: 'ficha' },
];

interface ShellPacienteProps {
  usuario: Usuario;
  aoSair: () => void;
  children: ReactNode;
}

/** App do paciente: mobile-first, uma coluna, navegação inferior ao alcance do polegar. */
export function ShellPaciente({ usuario, aoSair, children }: ShellPacienteProps) {
  return (
    <div className="app-paciente">
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="app-paciente__topo">
        <Marca />
        <button type="button" className="btn btn--compacto" onClick={aoSair} aria-label={`Sair (${usuario.nome})`}>
          <Icone nome="sair" />
          Sair
        </button>
      </header>
      <main id="conteudo" className="app-paciente__conteudo" tabIndex={-1}>
        {children}
      </main>
      <nav aria-label="Seções do app" className="app-paciente__nav">
        {NAV_PACIENTE.map((item) => (
          <NavLink key={item.para} to={item.para} className="app-paciente__aba">
            <Icone nome={item.icone} tamanho={22} />
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
