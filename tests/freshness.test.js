import { describe, it, expect } from 'vitest';
import { isStale, parseSourceTimestamp, MAX_DATA_AGE_HOURS } from '../lib/freshness';

describe('parseSourceTimestamp', () => {
  it('traktuje czas źródła jako czas polski (zima, UTC+1)', () => {
    expect(parseSourceTimestamp('2026-01-15 12:00:00')).toBe(Date.UTC(2026, 0, 15, 11, 0, 0));
  });

  it('uwzględnia czas letni (UTC+2)', () => {
    expect(parseSourceTimestamp('2026-07-15 12:00:00')).toBe(Date.UTC(2026, 6, 15, 10, 0, 0));
  });

  it('zwraca null dla nieczytelnych wartości', () => {
    expect(parseSourceTimestamp('')).toBeNull();
    expect(parseSourceTimestamp(undefined)).toBeNull();
    expect(parseSourceTimestamp('wczoraj')).toBeNull();
  });
});

describe('isStale', () => {
  const now = Date.UTC(2026, 0, 15, 11, 0, 0); // 12:00 w Polsce

  it('świeży pomiar nie jest nieświeży', () => {
    expect(isStale('2026-01-15 11:30:00', now)).toBe(false);
  });

  it('pomiar dokładnie na granicy jeszcze się liczy, starszy już nie', () => {
    const border = `2026-01-15 ${String(12 - MAX_DATA_AGE_HOURS).padStart(2, '0')}:00:00`;
    expect(isStale(border, now)).toBe(false);
    expect(isStale('2026-01-15 08:59:59', now)).toBe(true);
  });

  it('można podać własny próg', () => {
    expect(isStale('2026-01-15 01:00:00', now, 12)).toBe(false);
    expect(isStale('2026-01-14 23:00:00', now, 12)).toBe(true);
  });

  it('brak znacznika czasu nie wyklucza stacji', () => {
    expect(isStale(null, now)).toBe(false);
  });
});
