import { calculateAQI } from './aqiLevels';
import { groupCities } from './cities';
import { translate } from './i18n';
import { matchesStation } from './stationKey';

const round1 = (value) => Math.round(value * 10) / 10;

// Dane do podglądu linku (obraz Open Graph): miasto, stacja albo cała Polska. Zwraca null, gdy nie ma czego pokazać.
// stations: świeże stacje; stats: statystyki z summarizeStations (średnie PM dla całego kraju).
export function buildOgData({ city, station }, stations, stats, locale = 'pl') {
  const t = (text, vars) => translate(locale, text, vars);
  if (station) {
    const s = stations.find((item) => matchesStation(item, station));
    if (!s) return null;
    return {
      kind: 'station',
      title: s.name,
      subtitle: s.city,
      aqi: { ...s.aqi, label: t(s.aqi.label) },
      pm25: s.data.pm25,
      pm10: s.data.pm10
    };
  }

  if (city) {
    const found = groupCities(stations).find((c) => c.slug === city);
    if (!found) return null;
    return {
      kind: 'city',
      title: found.name,
      subtitle: t('mediana ze stacji: {count}', { count: found.count }),
      aqi: { ...found.aqi, label: t(found.aqi.label) },
      pm25: found.pm25,
      pm10: found.pm10
    };
  }

  const pm25 = round1(Number(stats?.avgPM25) || 0);
  const pm10 = round1(Number(stats?.avgPM10) || 0);
  return {
    kind: 'country',
    title: t('Jakość powietrza w Polsce'),
    subtitle: t('średnia ze stacji: {count}', { count: stats?.total ?? stations.length }),
    aqi: (({ label, ...rest }) => ({ ...rest, label: t(label) }))(calculateAQI(pm25, pm10)),
    pm25,
    pm10
  };
}
