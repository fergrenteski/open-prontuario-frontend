import type { LocalizacaoPort } from '../application/ports';

/** Geolocation API do navegador; precisão baixa basta para comparar distâncias até as unidades. */
export const geolocalizacaoNavegador: LocalizacaoPort = {
  obterPosicao: () =>
    new Promise((ok, falha) => {
      if (!('geolocation' in navigator)) return falha(new Error('sem geolocalização'));
      navigator.geolocation.getCurrentPosition(
        (p) => ok({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        falha,
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      );
    }),
};
