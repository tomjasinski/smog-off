// Dobór artykułów z bloga do poziomu jakości powietrza wybranej stacji (klucze jak w lib/aqiLevels.js)
const HEALTH = ['jak-chronic-sie-przed-smogiem', 'smog-a-zdrowie-dzieci'];
const BASICS = ['czym-jest-pm25-pm10', 'tani-czujnik-zawyza-pm25'];

const SLUGS_BY_LEVEL = {
  good: BASICS,
  fair: BASICS,
  moderate: ['jak-chronic-sie-przed-smogiem', 'czym-jest-pm25-pm10'],
  poor: HEALTH,
  'very-poor': HEALTH,
  'extremely-poor': HEALTH
};

const HEADINGS = {
  good: 'Warto wiedzieć',
  fair: 'Warto wiedzieć',
  moderate: 'Co możesz zrobić',
  poor: 'Jak się chronić',
  'very-poor': 'Jak się chronić',
  'extremely-poor': 'Jak się chronić'
};

export function pickPostsForLevel(level, posts, limit = 2) {
  const slugs = SLUGS_BY_LEVEL[level] ?? [];
  return slugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter(Boolean)
    .slice(0, limit);
}

export function contextHeading(level) {
  return HEADINGS[level] ?? 'Warto wiedzieć';
}
