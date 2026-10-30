import type { Sessao } from '../shared/domain/tipos';
import { sessaoStorage } from '../shared/infrastructure/sessaoStorage';

// Estado da sessão fora do React para o httpClient ler o token a cada requisição.
let atual: Sessao | null = sessaoStorage.carregar();
const ouvintes = new Set<() => void>();

export const sessaoGlobal = {
  obterToken: (): string | null => (atual && atual.expiraEm > Date.now() ? atual.token : null),
  definir(sessao: Sessao | null) {
    atual = sessao;
    if (sessao) sessaoStorage.salvar(sessao);
    else sessaoStorage.limpar();
    ouvintes.forEach((f) => f());
  },
};

export function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export const sessaoAtual = () => atual;
