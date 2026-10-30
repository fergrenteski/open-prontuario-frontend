// Composition root: único lugar que conhece as implementações (infrastructure) das portas.
import { criarSelecaoUnidadeHttp } from '../features/atendente/selecao-unidade/infrastructure/selecaoUnidadeHttp';
import { criarAutenticacaoDev } from '../features/auth/login/infrastructure/autenticacaoDev';
import { criarAutenticacaoEntra } from '../features/auth/login/infrastructure/autenticacaoEntra';
import { config } from '../shared/infrastructure/config';
import { criarHttpClient } from '../shared/infrastructure/httpClient';
import { sessaoGlobal } from './sessaoGlobal';

const http = criarHttpClient({
  baseUrl: config.apiBaseUrl,
  obterToken: sessaoGlobal.obterToken,
  aoNaoAutenticar: () => sessaoGlobal.definir(null),
});

export const portas = {
  autenticacao:
    config.authMode === 'entra'
      ? criarAutenticacaoEntra({ apiBaseUrl: config.apiBaseUrl, ...config.entra })
      : criarAutenticacaoDev(http),
  selecaoUnidade: criarSelecaoUnidadeHttp(http),
};
