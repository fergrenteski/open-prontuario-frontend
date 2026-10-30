import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import type { Usuario } from '../../../../shared/domain/tipos';
import type { AutenticacaoPort } from '../application/ports';
import { criarSessao } from '../domain/login';

interface DevTokenResposta {
  accessToken: string;
  expiresIn: number;
  usuario: Usuario;
}

/** Modo dev do BFF: GET /auth/personas + POST /auth/dev-token (JWT HS256). */
export function criarAutenticacaoDev(http: HttpClient): AutenticacaoPort {
  return {
    modo: 'dev',
    listarPersonas: () => http.get<Usuario[]>('/auth/personas'),
    async entrar(usuarioId) {
      const r = await http.post<DevTokenResposta>('/auth/dev-token', { usuarioId });
      return criarSessao(r.accessToken, r.expiresIn, r.usuario, Date.now());
    },
  };
}
