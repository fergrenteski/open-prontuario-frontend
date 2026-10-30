import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { FilaPage } from '../features/atendente/fila/ui/FilaPage';
import { ProntuarioPage } from '../features/atendente/prontuario/ui/ProntuarioPage';
import { SelecaoUnidadePage } from '../features/atendente/selecao-unidade/ui/SelecaoUnidadePage';
import { LoginPage } from '../features/auth/login/ui/LoginPage';
import { useSessao } from '../shared/application/sessao';
import { rotaInicial } from '../shared/domain/perfis';
import { AreaPainel } from './Areas';
import { portas } from './container';
import { Protegida } from './Protegida';
import { SessaoProvider } from './sessao';

function Inicio() {
  const { sessao } = useSessao();
  return <Navigate to={sessao ? rotaInicial(sessao.usuario) : '/entrar'} replace />;
}

export function App() {
  return (
    <SessaoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<LoginPage porta={portas.autenticacao} />} />
          <Route
            element={
              <Protegida perfis={['ATENDENTE', 'PROFISSIONAL', 'GESTOR']}>
                <AreaPainel />
              </Protegida>
            }
          >
            <Route path="/atendimento" element={<SelecaoUnidadePage porta={portas.selecaoUnidade} />} />
            <Route path="/atendimento/:unidadeId/fila" element={<FilaPage porta={portas.fila} />} />
            <Route
              path="/atendimento/:unidadeId/prontuario/:pacienteId"
              element={
                <Protegida perfis={['ATENDENTE', 'PROFISSIONAL']}>
                  <ProntuarioPage porta={portas.prontuario} />
                </Protegida>
              }
            />
          </Route>
          <Route path="*" element={<Inicio />} />
        </Routes>
      </BrowserRouter>
    </SessaoProvider>
  );
}
