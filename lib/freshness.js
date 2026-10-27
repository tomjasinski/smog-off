// Maksymalny wiek pomiaru, który pokazujemy na mapie i w rankingach.
// Czujniki raportują średnie z ok. godziny, więc 3 h = kilka brakujących raportów z rzędu.
export const MAX_DATA_AGE_HOURS = 3;

const SOURCE_TIME_ZONE = 'Europe/Warsaw';

// Źródło podaje czas bez strefy ("2026-10-27 14:47:51"); traktujemy go jako czas polski.
export function parseSourceTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value || '');
  if (!match) return null;
  const [y, mo, d, h, mi, s] = match.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);

  // Przesunięcie strefy w danym momencie = (czas ścienny w Warszawie) - (UTC)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SOURCE_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(asUtc)).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - (wall - asUtc);
}

export function isStale(timestamp, now = Date.now(), maxAgeHours = MAX_DATA_AGE_HOURS) {
  const measured = parseSourceTimestamp(timestamp);
  // Brak lub nieczytelny znacznik czasu: nie wykluczamy, bo nie mamy dowodu, że dane są stare.
  if (measured === null) return false;
  return now - measured > maxAgeHours * 3600 * 1000;
}
