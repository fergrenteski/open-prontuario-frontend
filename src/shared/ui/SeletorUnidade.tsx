import type { Unidade } from '../domain/tipos';

interface Props {
  unidades: Unidade[];
  valor: string | null;
  aoMudar: (unidadeId: string) => void;
  rotulo?: string;
}

export function SeletorUnidade({ unidades, valor, aoMudar, rotulo = 'Unidade' }: Props) {
  return (
    <div className="campo seletor-unidade">
      <label htmlFor="seletor-unidade">{rotulo}</label>
      <select id="seletor-unidade" value={valor ?? ''} onChange={(e) => aoMudar(e.target.value)}>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome} ({u.tipo})
          </option>
        ))}
      </select>
    </div>
  );
}
