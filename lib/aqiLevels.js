// Europejski Indeks Jakości Powietrza (EAQI) Europejskiej Agencji Środowiska,
// progi godzinowe (µg/m³) zgodne z wytycznymi WHO 2021:
// https://airindex.eea.europa.eu/AQI/index.html
// Klucze poziomów odpowiadają kategoriom EAQI: Good, Fair, Moderate, Poor, Very poor, Extremely poor.
export const AQI_LEVEL_LIST = [
  { level: 'good', color: '#4ade80', label: 'Dobra' },
  { level: 'fair', color: '#a3e635', label: 'Dość dobra' },
  { level: 'moderate', color: '#fbbf24', label: 'Umiarkowana' },
  { level: 'poor', color: '#fb923c', label: 'Zła' },
  { level: 'very-poor', color: '#ef4444', label: 'Bardzo zła' },
  { level: 'extremely-poor', color: '#7f1d1d', label: 'Ekstremalnie zła' }
];

const PM25_MAX = [5, 15, 50, 90, 140, Infinity];
const PM10_MAX = [15, 45, 120, 195, 270, Infinity];

const withMax = (maxes) =>
  AQI_LEVEL_LIST.map((level, i) => ({ ...level, max: maxes[i] }));

export const AQI_LEVELS = {
  pm25: withMax(PM25_MAX),
  pm10: withMax(PM10_MAX)
};

// Opis zakresu poziomu, np. "0 – 5", "> 5 – 15", "> 140"
export function describeRange(type, idx) {
  const levels = AQI_LEVELS[type];
  const lower = idx > 0 ? levels[idx - 1].max : 0;
  const upper = levels[idx].max;
  if (upper === Infinity) return `> ${lower}`;
  return idx > 0 ? `> ${lower} – ${upper}` : `0 – ${upper}`;
}

export function calculateAQI(pm25, pm10) {
  if (!pm25 || !pm10) {
    return { level: 'unknown', color: '#9ca3af', label: 'Brak danych' };
  }

  // Znajdź najgorszy poziom z obu wskaźników
  const pm25Level = AQI_LEVELS.pm25.find(level => pm25 <= level.max);
  const pm10Level = AQI_LEVELS.pm10.find(level => pm10 <= level.max);

  // Zwróć gorszy wynik
  const pm25Index = AQI_LEVELS.pm25.indexOf(pm25Level);
  const pm10Index = AQI_LEVELS.pm10.indexOf(pm10Level);

  return pm25Index > pm10Index ? pm25Level : pm10Level;
}

export function getPMColor(value, type) {
  const levels = AQI_LEVELS[type];
  if (!levels) return '#9ca3af';
  
  const level = levels.find(l => value <= l.max);
  return level ? level.color : '#9ca3af';
}

export function getPMLevelInfo(value, type) {
  const levels = AQI_LEVELS[type];
  if (!levels) return null;
  
  return levels.find(l => value <= l.max);
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

// Wybiera biały lub ciemny tekst o lepszym kontraście na danym tle (WCAG 1.4.3)
export function getReadableTextColor(backgroundHex) {
  const bg = relativeLuminance(backgroundHex);
  const contrastWhite = 1.05 / (bg + 0.05);
  const contrastDark = (bg + 0.05) / (relativeLuminance('#111827') + 0.05);
  return contrastWhite >= contrastDark ? '#ffffff' : '#111827';
}
