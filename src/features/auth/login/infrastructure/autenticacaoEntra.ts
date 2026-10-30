import type { IPublicClientApplication } from '@azure/msal-browser';
import { criarHttpClient } from '../../../../shared/infrastructure/httpClient';
import type { Usuario } from '../../../../shared/domain/tipos';
import type { AutenticacaoPort } from '../application/ports';
import { criarSessao } from '../domain/login';

export interface ConfigEntra {
  apiBaseUrl: string;
  clientId: string;
  tenantId: string;
  apiScope: string;
}

/**
 * Microsoft Entra ID via MSAL (popup). O token de acesso do escopo da API do BFF é usado
 * como Bearer; o BFF valida o JWT (JWKS) e devolve o usuário com os perfis em GET /auth/me.
 * O MSAL só é baixado quando o modo entra é usado (import dinâmico).
 * ponytail: sem renovação silenciosa do token; ao expirar (≈1 h) o usuário entra de novo.
 */
export function criarAutenticacaoEntra(cfg: ConfigEntra): AutenticacaoPort {
  let msal: Promise<IPublicClientApplication> | undefined;
  const obterMsal = () =>
    (msal ??= import('@azure/msal-browser').then(async ({ PublicClientApplication }) => {
      const app = new PublicClientApplication({
        auth: {
          clientId: cfg.clientId,
          authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: 'sessionStorage' },
      });
      await app.initialize();
      return app;
    }));

  return {
    modo: 'entra',
    listarPersonas: async () => [],
    async entrar() {
      const app = await obterMsal();
      const login = await app.loginPopup({ scopes: [cfg.apiScope] });
      const token = await app.acquireTokenSilent({ account: login.account, scopes: [cfg.apiScope] });
      const expiraSeg = Math.round(((token.expiresOn?.getTime() ?? Date.now() + 3600_000) - Date.now()) / 1000);
      // O /auth/me precisa do token antes de a sessão existir: cliente HTTP com esse token.
      const http = criarHttpClient({ baseUrl: cfg.apiBaseUrl, obterToken: () => token.accessToken });
      const usuario = await http.get<Usuario>('/auth/me');
      return criarSessao(token.accessToken, expiraSeg, usuario, Date.now());
    },
  };
}
