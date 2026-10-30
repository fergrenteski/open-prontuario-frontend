import { Outlet } from 'react-router';
import { useSessao } from '../shared/application/sessao';
import { temPerfil } from '../shared/domain/perfis';
import { ShellPaciente, ShellPainel, type ItemNavegacao } from '../shared/ui/Shells';

function navegacaoPainel(gestor: boolean, atende: boolean): ItemNavegacao[] {
  const itens: ItemNavegacao[] = [];
  if (atende || gestor) itens.push({ para: '/atendimento', rotulo: 'Filas', icone: 'pessoas' });
  if (gestor) {
    itens.push(
      { para: '/gestao/indicadores', rotulo: 'Indicadores', icone: 'grafico' },
      { para: '/gestao/auditoria', rotulo: 'Auditoria', icone: 'escudo' },
      { para: '/gestao/unidades', rotulo: 'Unidades', icone: 'unidade' },
      { para: '/gestao/lotacoes', rotulo: 'Lotações', icone: 'ficha' },
    );
  }
  return itens;
}

export function AreaPainel() {
  const { sessao, sair } = useSessao();
  if (!sessao) return null;
  const u = sessao.usuario;
  return (
    <ShellPainel usuario={u} aoSair={sair} navegacao={navegacaoPainel(temPerfil(u, 'GESTOR'), temPerfil(u, 'ATENDENTE', 'PROFISSIONAL'))}>
      <Outlet />
    </ShellPainel>
  );
}

export function AreaPaciente() {
  const { sessao, sair } = useSessao();
  if (!sessao) return null;
  return (
    <ShellPaciente usuario={sessao.usuario} aoSair={sair}>
      <Outlet />
    </ShellPaciente>
  );
}
