import { slugify } from './slug';

// Krótki, stabilny skrót identyfikatora stacji (cyrb53, zapis 36-kowy). Identyfikatory ze źródła mają postać
// "szerokość,długość,NAZWA SZKOŁY", więc w adresach (i podglądach linków w komunikatorach) zastępujemy je skrótem.
export function hashId(value) {
  const text = String(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// Klucz do adresu strony stacji: czytelny początek nazwy + skrót, np. "sp-nr-71-im-janusza-kusocinskiego-w-poznaniu-1k2j3h4g5"
export function stationKey(station) {
  const slug = slugify(station.name || 'stacja').slice(0, 60).replace(/-+$/, '');
  return `${slug || 'stacja'}-${hashId(station.id)}`;
}

// Skrót z klucza (część po ostatnim myślniku) albo cały tekst, gdy to sam skrót
const hashOf = (key) => String(key).slice(String(key).lastIndexOf('-') + 1);

// Pasuje do stacji: pełny identyfikator (stare linki), klucz z nazwą albo sam skrót
export function matchesStation(station, key) {
  const text = String(key);
  return String(station.id) === text || hashId(station.id) === hashOf(text);
}
