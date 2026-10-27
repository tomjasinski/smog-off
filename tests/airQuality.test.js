import { describe, it, expect } from 'vitest';
import { mapStation, summarizeStations } from '../lib/airQuality';

const raw = (overrides = {}) => ({
  school: { name: 'SP 1', city: 'POZNAŃ', street: 'UL. A', latitude: '52.4', longitude: '16.9' },
  data: { pm25_avg: 4.04, pm10_avg: 10.06, temperature_avg: 12.34, humidity_avg: 60, pressure_avg: 1010 },
  timestamp: '2026-01-15 12:00:00',
  ...overrides
});
const now = Date.UTC(2026, 0, 15, 11, 30, 0); // 12:30 w Polsce

describe('mapStation', () => {
  it('zaokrągla pomiary do 1 miejsca i liczy poziom z surowych wartości', () => {
    const s = mapStation(raw());
    expect(s.data.pm25).toBe(4);
    expect(s.data.pm10).toBe(10.1);
    expect(s.data.temperature).toBe(12.3);
    expect(s.aqi.level).toBe('good');
    expect(s.latitude).toBe(52.4);
  });

  it('nadaje różne id szkołom o tych samych współrzędnych', () => {
    const a = mapStation(raw());
    const b = mapStation(raw({ school: { ...raw().school, name: 'SP 2' } }));
    expect(a.id).not.toBe(b.id);
  });

  it('używa id szkoły, jeśli źródło je podaje', () => {
    expect(mapStation(raw({ school: { ...raw().school, id: 'abc' } })).id).toBe('abc');
  });
});

describe('summarizeStations', () => {
  const stations = [
    mapStation(raw()),
    mapStation(raw({ school: { ...raw().school, name: 'SP 2' }, data: { pm25_avg: 60, pm10_avg: 70 } })),
    mapStation(raw({ school: { ...raw().school, name: 'SP 3' }, timestamp: '2026-01-14 08:00:00' }))
  ];

  it('pomija nieświeże pomiary i je liczy', () => {
    const { stations: fresh, stats } = summarizeStations(stations, now);
    expect(fresh).toHaveLength(2);
    expect(stats.total).toBe(2);
    expect(stats.excludedStale).toBe(1);
  });

  it('zlicza stacje w poziomach i liczy średnie z pozostałych', () => {
    const { stats } = summarizeStations(stations, now);
    expect(stats.levels.good).toBe(1);
    expect(stats.levels.poor).toBe(1);
    expect(Object.values(stats.levels).reduce((a, b) => a + b, 0)).toBe(2);
    expect(stats.avgPM25).toBe('32.0'); // (4 + 60) / 2
  });

  it('nie wywraca się na pustej liście', () => {
    const { stats } = summarizeStations([], now);
    expect(stats.total).toBe(0);
    expect(stats.avgPM25).toBe('0.0');
  });
});
