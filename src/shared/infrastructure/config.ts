// Configuração lida SOMENTE das variáveis de build (VITE_*). Sem URL fixa no código:
// na ausência de VITE_API_BASE_URL usa o mesmo domínio (`/api`), útil atrás de proxy reverso.
const env = import.meta.env;

export const config = {
  apiBaseUrl: (env.VITE_API_BASE_URL || '/api').replace(/\/+$/, ''),
  authMode: env.VITE_AUTH_MODE === 'entra' ? ('entra' as const) : ('dev' as const),
  entra: {
    clientId: env.VITE_ENTRA_CLIENT_ID ?? '',
    tenantId: env.VITE_ENTRA_TENANT_ID ?? '',
    apiScope: env.VITE_ENTRA_API_SCOPE ?? '',
  },
};
