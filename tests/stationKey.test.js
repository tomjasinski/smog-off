import { describe, it, expect } from 'vitest';
import { hashId, stationKey, matchesStation } from '../lib/stationKey';

const station = { id: '52.410060,16.889354,SZKOŁA PODSTAWOWA NR 71 IM. JANUSZA KUSOCIŃSKIEGO W POZNANIU', name: 'SZKOŁA PODSTAWOWA NR 71 IM. JANUSZA KUSOCIŃSKIEGO W POZNANIU' };

describe('stationKey', () => {
  it('daje krótki klucz złożony tylko ze znaków bezpiecznych w adresie', () => {
    const key = stationKey(station);
    expect(key).toMatch(/^[a-z0-9-]+$/);
    expect(key.length).toBeLessThan(80);
    expect(key.startsWith('szkola-podstawowa-nr-71')).toBe(true);
  });

  it('hashId jest stabilny i różni stacje', () => {
    expect(hashId('a')).toBe(hashId('a'));
    expect(hashId('51.1,17.0,SP 1')).not.toBe(hashId('51.1,17.0,SP 2'));
    expect(hashId('x')).toMatch(/^[a-z0-9]+$/);
  });

  it('matchesStation przyjmuje klucz, sam skrót i stary pełny identyfikator', () => {
    expect(matchesStation(station, stationKey(station))).toBe(true);
    expect(matchesStation(station, hashId(station.id))).toBe(true);
    expect(matchesStation(station, station.id)).toBe(true);
    expect(matchesStation(station, 'inna-stacja-abc123')).toBe(false);
    expect(matchesStation(station, 'zzz')).toBe(false);
  });

  it('nie myli stacji o podobnej nazwie', () => {
    const other = { id: '52.5,16.9,SZKOŁA PODSTAWOWA NR 71 IM. JANUSZA KUSOCIŃSKIEGO W POZNANIU', name: station.name };
    expect(stationKey(other)).not.toBe(stationKey(station));
    expect(matchesStation(other, stationKey(station))).toBe(false);
  });
});
