import { rotuloCongestionamento } from '../domain/congestionamento';
import type { NivelCongestionamento } from '../domain/tipos';

/** Medidor de 3 barras + texto (nível nunca comunicado só por cor). */
export function Medidor({ nivel }: { nivel: NivelCongestionamento }) {
  return (
    <span className="medidor" data-nivel={nivel}>
      <span className="medidor__barras" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {rotuloCongestionamento(nivel)}
    </span>
  );
}
