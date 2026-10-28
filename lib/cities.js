import { calculateAQI } from './aqiLevels';
import { slugify } from './slug';

// Podstrona miasta powstaje tylko wtedy, gdy ma dość stacji, by mediana była wiarygodna
// i strona zawierała coś więcej niż jedną liczbę.
export const MIN_STATIONS_FOR_CITY_PAGE = 5;

// Źródło podaje nazwy wielkimi literami ("OSTROWIEC ŚWIĘTOKRZYSKI"); do wyświetlania zamieniamy je na normalne.
export function titleCasePl(name) {
  return name
    .trim()
    .toLocaleLowerCase('pl-PL')
    .replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toLocaleUpperCase('pl-PL'));
}

export function citySlug(name) {
  return slugify(name);
}

// Odczyty poniżej 1 µg/m³ traktujemy jako podejrzane (jak w rankingach na stronie statystyk)
export const isPlausible = (station) => station.data.pm25 >= 1 && station.data.pm10 >= 1;

const round1 = (value) => Math.round(value * 10) / 10;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Grupuje stacje według miejscowości (bez względu na wielkość liter) i zwraca miasta o co najmniej minStations stacjach.
// Mediana jest odporna na pojedyncze błędne czujniki.
export function groupCities(stations, minStations = MIN_STATIONS_FOR_CITY_PAGE) {
  const groups = new Map();
  for (const station of stations) {
    if (!isPlausible(station)) continue;
    const key = (station.city || '').trim().toLocaleLowerCase('pl-PL');
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(station);
  }

  return [...groups.values()]
    .filter((list) => list.length >= minStations)
    .map((list) => {
      const name = titleCasePl(list[0].city);
      const pm25 = round1(median(list.map((s) => s.data.pm25)));
      const pm10 = round1(median(list.map((s) => s.data.pm10)));
      return { name, slug: citySlug(name), stations: list, count: list.length, pm25, pm10, aqi: calculateAQI(pm25, pm10) };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}
