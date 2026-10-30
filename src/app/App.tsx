import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { FilaPage } from '../features/atendente/fila/ui/FilaPage';
import { ProntuarioPage } from '../features/atendente/prontuario/ui/ProntuarioPage';
import { SelecaoUnidadePage } from '../features/atendente/selecao-unidade/ui/SelecaoUnidadePage';
import { AvisoChegadaPage } from '../features/paciente/aviso-chegada/ui/AvisoChegadaPage';
import { ConsentimentosPage } from '../features/paciente/consentimentos/ui/ConsentimentosPage';
import { MeuProntuarioPage } from '../features/paciente/meu-prontuario/ui/MeuProntuarioPage';
import { UnidadesProximasPage } from '../features/paciente/unidades-proximas/ui/UnidadesProximasPage';
import { LoginPage } from '../features/auth/login/ui/LoginPage';
import { useSessao } from '../shared/application/sessao';
import { rotaInicial } from '../shared/domain/perfis';
import { AreaPaciente, AreaPainel } from './Areas';
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
          <Route
            element={
              <Protegida perfis={['PACIENTE']}>
                <AreaPaciente />
              </Protegida>
            }
          >
            <Route
              path="/paciente/unidades"
              element={<UnidadesProximasPage porta={portas.unidadesProximas} localizacao={portas.localizacao} />}
            />
            <Route path="/paciente/unidades/:unidadeId/aviso" element={<AvisoChegadaPage porta={portas.avisoChegada} />} />
            <Route path="/paciente/consentimentos" element={<ConsentimentosPage porta={portas.consentimentos} />} />
            <Route path="/paciente/prontuario" element={<MeuProntuarioPage porta={portas.meuProntuario} />} />
          </Route>
          <Route path="*" element={<Inicio />} />
        </Routes>
      </BrowserRouter>
    </SessaoProvider>
  );
}
