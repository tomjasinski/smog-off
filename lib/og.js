import { calculateAQI } from './aqiLevels';
import { groupCities } from './cities';

const round1 = (value) => Math.round(value * 10) / 10;

// Dane do podglądu linku (obraz Open Graph): miasto, stacja albo cała Polska. Zwraca null, gdy nie ma czego pokazać.
// stations: świeże stacje; stats: statystyki z summarizeStations (średnie PM dla całego kraju).
export function buildOgData({ city, station }, stations, stats) {
  if (station) {
    const s = stations.find((item) => String(item.id) === String(station));
    if (!s) return null;
    return {
      kind: 'station',
      title: s.name,
      subtitle: s.city,
      aqi: s.aqi,
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
      subtitle: `mediana ze stacji: ${found.count}`,
      aqi: found.aqi,
      pm25: found.pm25,
      pm10: found.pm10
    };
  }

  const pm25 = round1(Number(stats?.avgPM25) || 0);
  const pm10 = round1(Number(stats?.avgPM10) || 0);
  return {
    kind: 'country',
    title: 'Jakość powietrza w Polsce',
    subtitle: `średnia ze stacji: ${stats?.total ?? stations.length}`,
    aqi: calculateAQI(pm25, pm10),
    pm25,
    pm10
  };
}
