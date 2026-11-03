import { describe, it, expect } from 'vitest';
import { buildOgData } from '../lib/og';
import { mapStation } from '../lib/airQuality';

const station = (id, name, city, pm25, pm10) =>
  mapStation({
    school: { id, name, city, street: 'UL. A', latitude: '52.4', longitude: '16.9' },
    data: { pm25_avg: pm25, pm10_avg: pm10 },
    timestamp: '2026-01-15 12:00:00'
  });

const stations = [
  ...[1, 2, 3, 4, 5].map((i) => station(`p${i}`, `SP ${i}`, 'POZNAŃ', 20 + i, 30 + i)),
  station('k1', 'SP K', 'KRAKÓW', 80, 100)
];

describe('buildOgData', () => {
  it('stacja: nazwa, miejscowość i jej poziom', () => {
    const data = buildOgData({ station: 'k1' }, stations, null);
    expect(data).toMatchObject({ kind: 'station', title: 'SP K', subtitle: 'KRAKÓW', pm25: 80, pm10: 100 });
    expect(data.aqi.level).toBe('poor');
  });

  it('miasto: mediana ze stacji miasta (tylko miasta z podstroną)', () => {
    const data = buildOgData({ city: 'poznan' }, stations, null);
    expect(data).toMatchObject({ kind: 'city', title: 'Poznań', pm25: 23, pm10: 33 });
    expect(data.subtitle).toContain('5');
    expect(buildOgData({ city: 'krakow' }, stations, null)).toBeNull();
  });

  it('nieznana stacja lub miasto daje null', () => {
    expect(buildOgData({ station: 'x' }, stations, null)).toBeNull();
    expect(buildOgData({ city: 'x' }, stations, null)).toBeNull();
  });

  it('bez parametrów: cała Polska ze średnich w statystykach', () => {
    const data = buildOgData({}, stations, { avgPM25: '24.04', avgPM10: '34.0', total: 6 });
    expect(data).toMatchObject({ kind: 'country', pm25: 24, pm10: 34 });
    expect(data.aqi.level).toBe('moderate');
  });
});
