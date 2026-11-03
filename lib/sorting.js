// Sortowanie list miast i stacji: alfabetycznie albo według jakości powietrza (PM2.5, a przy remisie PM10)
export const QUALITY_SORT_OPTIONS = [
  { value: 'pm25-asc', label: 'Jakość: od najczystszych' },
  { value: 'pm25-desc', label: 'Jakość: od najbardziej zanieczyszczonych' },
  { value: 'name', label: 'Alfabetycznie A–Z' }
];

const byQuality = (a, b) => a.pm25 - b.pm25 || a.pm10 - b.pm10;

// items: obiekty z polami name, pm25, pm10. Zwraca nową posortowaną tablicę.
export function sortByMode(items, mode) {
  const list = [...items];
  if (mode === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  if (mode === 'pm25-desc') return list.sort((a, b) => byQuality(b, a));
  return list.sort(byQuality);
}
