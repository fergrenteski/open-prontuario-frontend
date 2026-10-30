import { Link } from 'react-router';
import { formatarDuracao } from '../../../../shared/domain/datas';
import { AlertaErro, Carregando, Vazio } from '../../../../shared/ui/Estados';
import { Icone } from '../../../../shared/ui/Icone';
import { Medidor } from '../../../../shared/ui/Medidor';
import type { LocalizacaoPort, UnidadesProximasPort } from '../application/ports';
import { useUnidadesProximas } from '../application/useUnidadesProximas';
import { RAIO_PADRAO_KM, formatarDistancia, resumoMovimento } from '../domain/unidadesProximas';
import './unidades-proximas.css';

interface Props {
  porta: UnidadesProximasPort;
  localizacao: LocalizacaoPort;
}

export function UnidadesProximasPage({ porta, localizacao }: Props) {
  const consulta = useUnidadesProximas(porta, localizacao);
  const { dados } = consulta;

  return (
    <div className="proximas pilha">
      <header>
        <h1 className="placa proximas__titulo">Para onde ir agora</h1>
        {dados && (
          <p className="proximas__origem">
            <Icone nome="local" />
            {dados.localizacaoReal
              ? 'Distâncias a partir de onde você está.'
              : 'Sem acesso à sua localização: distâncias a partir do centro de Curitiba.'}
          </p>
        )}
      </header>

      {consulta.carregando && <Carregando texto="Procurando unidades perto de você…" />}
      {consulta.erro !== undefined && <AlertaErro erro={consulta.erro} aoTentarDeNovo={consulta.recarregar} />}
      {dados?.unidades.length === 0 && (
        <Vazio titulo={`Nenhuma unidade em até ${RAIO_PADRAO_KM} km`}>
          <p>Em caso de emergência, ligue 192 (SAMU).</p>
        </Vazio>
      )}

      {dados && dados.unidades.length > 0 && (
        <ol className="proximas__lista" aria-label="Unidades da mais próxima para a mais distante">
          {dados.unidades.map((u) => (
            <li key={u.id} className="ficha proximas__cartao">
              <div className="proximas__topo">
                <span className="proximas__tipo">{u.tipo}</span>
                <span className="dado proximas__distancia">{formatarDistancia(u.distanciaKm)}</span>
              </div>
              <h2 className="placa proximas__nome">{u.nome}</h2>
              {u.visaoAgregada ? (
                <div className="proximas__movimento">
                  <Medidor nivel={u.visaoAgregada.nivelCongestionamento} />
                  <p className="suave">{resumoMovimento(u.visaoAgregada)}</p>
                  <dl className="proximas__numeros">
                    <div>
                      <dt>Presentes</dt>
                      <dd className="dado">{u.visaoAgregada.totalPresente}</dd>
                    </div>
                    <div>
                      <dt>A caminho</dt>
                      <dd className="dado">{u.visaoAgregada.totalACaminho}</dd>
                    </div>
                    <div>
                      <dt>Espera média</dt>
                      <dd className="dado">{formatarDuracao(u.visaoAgregada.tempoMedioEsperaMin)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="suave">{resumoMovimento(null)}</p>
              )}
              <Link
                to={`/paciente/unidades/${encodeURIComponent(u.id)}/aviso`}
                className="btn btn--primario btn--largo"
                aria-label={`Estou indo para ${u.nome}`}
              >
                Estou indo para cá
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="proximas__samu">Emergência com risco de vida? Ligue <a href="tel:192">192 (SAMU)</a>.</p>
    </div>
  );
}
