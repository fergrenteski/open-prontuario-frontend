import type { Sessao } from '../domain/tipos';

// sessionStorage: o token some ao fechar a aba (dado de saúde, menor exposição).
const CHAVE = 'open-prontuario.sessao';

export const sessaoStorage = {
  carregar(agora = Date.now()): Sessao | null {
    try {
      const bruto = sessionStorage.getItem(CHAVE);
      if (!bruto) return null;
      const sessao = JSON.parse(bruto) as Sessao;
      return sessao.expiraEm > agora ? sessao : null;
    } catch {
      return null;
    }
  },
  salvar(sessao: Sessao): void {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
    } catch {
      /* armazenamento indisponível: a sessão vale só enquanto a página estiver aberta */
    }
  },
  limpar(): void {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* idem */
    }
  },
};
