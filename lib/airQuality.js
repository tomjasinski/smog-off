import { AQI_LEVEL_LIST, calculateAQI } from './aqiLevels';
import { isStale } from './freshness';

const round1 = (value) => Math.round((value || 0) * 10) / 10;

// Zamienia rekord ze źródła na stację używaną przez aplikację
export function mapStation(item) {
  const aqi = calculateAQI(item.data?.pm25_avg, item.data?.pm10_avg);

  return {
    // Stabilny identyfikator; różne szkoły mogą mieć te same współrzędne, więc nazwa też wchodzi do klucza
    id: item.school?.id || `${item.school?.latitude},${item.school?.longitude},${item.school?.name || ''}`,
    name: item.school?.name || 'Nieznana lokalizacja',
    city: item.school?.city || '',
    street: item.school?.street || '',
    latitude: parseFloat(item.school?.latitude),
    longitude: parseFloat(item.school?.longitude),
    data: {
      pm25: round1(item.data?.pm25_avg),
      pm10: round1(item.data?.pm10_avg),
      temperature: round1(item.data?.temperature_avg),
      humidity: round1(item.data?.humidity_avg),
      pressure: round1(item.data?.pressure_avg)
    },
    aqi,
    timestamp: item.timestamp || null
  };
}

// Odrzuca nieświeże pomiary i liczy statystyki dla pozostałych stacji
export function summarizeStations(allStations, now = Date.now()) {
  const stations = allStations.filter(s => !isStale(s.timestamp, now));
  const excludedStale = allStations.length - stations.length;

  const valid = stations.filter(d => d.data.pm25 > 0 && d.data.pm10 > 0);
  const avg = (key) => valid.length
    ? valid.reduce((sum, d) => sum + d.data[key], 0) / valid.length
    : 0;

  const levels = Object.fromEntries(
    AQI_LEVEL_LIST.map(({ level }) => [level, stations.filter(d => d.aqi.level === level).length])
  );

  return {
    stations,
    stats: {
      total: stations.length,
      excludedStale,
      avgPM25: avg('pm25').toFixed(1),
      avgPM10: avg('pm10').toFixed(1),
      avgTemperature: avg('temperature').toFixed(1),
      levels
    }
  };
}
