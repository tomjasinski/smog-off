// Ujednolicone standardy WHO/EPA dla PM2.5 i PM10
export const AQI_LEVELS = {
  pm25: [
    { max: 12, level: 'good', color: '#4ade80', label: 'Dobra' },
    { max: 35.4, level: 'moderate', color: '#fbbf24', label: 'Średnia' },
    { max: 55.4, level: 'unhealthy', color: '#fb923c', label: 'Niezdrowa' },
    { max: 150.4, level: 'very-unhealthy', color: '#ef4444', label: 'Bardzo zła' },
    { max: 250.4, level: 'hazardous', color: '#a855f7', label: 'Niebezpieczna' },
    { max: Infinity, level: 'extreme', color: '#7f1d1d', label: 'Ekstremalnie zła' }
  ],
  pm10: [
    { max: 54, level: 'good', color: '#4ade80', label: 'Dobra' },
    { max: 154, level: 'moderate', color: '#fbbf24', label: 'Średnia' },
    { max: 254, level: 'unhealthy', color: '#fb923c', label: 'Niezdrowa' },
    { max: 354, level: 'very-unhealthy', color: '#ef4444', label: 'Bardzo zła' },
    { max: 424, level: 'hazardous', color: '#a855f7', label: 'Niebezpieczna' },
    { max: Infinity, level: 'extreme', color: '#7f1d1d', label: 'Ekstremalnie zła' }
  ]
};

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
