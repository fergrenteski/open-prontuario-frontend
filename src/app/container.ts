// Composition root: único lugar que conhece as implementações (infrastructure) das portas.
import { criarFilaHttp } from '../features/atendente/fila/infrastructure/filaHttp';
import { criarProntuarioHttp } from '../features/atendente/prontuario/infrastructure/prontuarioHttp';
import { criarSelecaoUnidadeHttp } from '../features/atendente/selecao-unidade/infrastructure/selecaoUnidadeHttp';
import { criarAutenticacaoDev } from '../features/auth/login/infrastructure/autenticacaoDev';
import { criarAutenticacaoEntra } from '../features/auth/login/infrastructure/autenticacaoEntra';
import { criarIndicadoresHttp } from '../features/gestor/indicadores/infrastructure/indicadoresHttp';
import { criarAvisoChegadaHttp } from '../features/paciente/aviso-chegada/infrastructure/avisoChegadaHttp';
import { criarConsentimentosHttp } from '../features/paciente/consentimentos/infrastructure/consentimentosHttp';
import { criarMeuProntuarioHttp } from '../features/paciente/meu-prontuario/infrastructure/meuProntuarioHttp';
import { geolocalizacaoNavegador } from '../features/paciente/unidades-proximas/infrastructure/geolocalizacaoNavegador';
import { criarUnidadesProximasHttp } from '../features/paciente/unidades-proximas/infrastructure/unidadesProximasHttp';
import { config } from '../shared/infrastructure/config';
import { criarHttpClient } from '../shared/infrastructure/httpClient';
import { sessaoGlobal } from './sessaoGlobal';

const http = criarHttpClient({
  baseUrl: config.apiBaseUrl,
  obterToken: sessaoGlobal.obterToken,
  aoNaoAutenticar: () => sessaoGlobal.definir(null),
  chaveApim: config.apimSubscriptionKey,
});

export const portas = {
  autenticacao:
    config.authMode === 'entra'
      ? criarAutenticacaoEntra({ apiBaseUrl: config.apiBaseUrl, apimSubscriptionKey: config.apimSubscriptionKey, ...config.entra })
      : criarAutenticacaoDev(http),
  selecaoUnidade: criarSelecaoUnidadeHttp(http),
  fila: criarFilaHttp(http),
  prontuario: criarProntuarioHttp(http),
  unidadesProximas: criarUnidadesProximasHttp(http),
  localizacao: geolocalizacaoNavegador,
  avisoChegada: criarAvisoChegadaHttp(http),
  consentimentos: criarConsentimentosHttp(http),
  meuProntuario: criarMeuProntuarioHttp(http),
  indicadores: criarIndicadoresHttp(http),
};
