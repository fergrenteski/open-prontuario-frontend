import { infoPrioridade, type Prioridade } from '../domain/prioridade';
import { Icone } from './Icone';

interface Props {
  prioridade: Prioridade;
  grande?: boolean;
  /** Mostra o tempo-alvo do protocolo junto do rótulo. */
  comTempo?: boolean;
}

/** Pulseira de Manchester: cor + forma + rótulo (nunca só cor). */
export function Pulseira({ prioridade, grande, comTempo }: Props) {
  const info = infoPrioridade(prioridade);
  return (
    <span className={`pulseira cor-${info.cor}${grande ? ' pulseira--grande' : ''}`} data-prioridade={prioridade}>
      <span className="pulseira__fecho">
        <Icone nome={info.forma} tamanho={grande ? 16 : 12} />
      </span>
      <span className="pulseira__rotulo">
        {info.rotulo}
        {comTempo && <span className="suave">&nbsp;· {info.tempoAlvo}</span>}
      </span>
    </span>
  );
}
