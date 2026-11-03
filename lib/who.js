// Zalecane przez WHO (wytyczne 2021) dobowe stężenia graniczne, µg/m³:
// https://www.who.int/publications/i/item/9789240034228
export const WHO_24H_LIMITS = { pm25: 15, pm10: 45 };

const round1 = (value) => Math.round(value * 10) / 10;

// Porównanie odczytu z dobową normą WHO: ratio to krotność normy (np. 1,3 = 30% powyżej), exceeds to przekroczenie
export function compareWithWho(value, type) {
  const limit = WHO_24H_LIMITS[type];
  const ratio = value / limit;
  return { value, limit, ratio: round1(ratio), exceeds: value > limit };
}

export function whoSummary(pm25, pm10) {
  return { pm25: compareWithWho(pm25, 'pm25'), pm10: compareWithWho(pm10, 'pm10') };
}
