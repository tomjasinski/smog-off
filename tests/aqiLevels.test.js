import { describe, it, expect } from 'vitest';
import {
  AQI_LEVELS,
  AQI_LEVEL_LIST,
  calculateAQI,
  describeRange,
  getPMColor,
  getReadableTextColor
} from '../lib/aqiLevels';

describe('progi EAQI', () => {
  it('mają dla PM2.5 i PM10 po jednym progu na każdy poziom', () => {
    expect(AQI_LEVELS.pm25).toHaveLength(AQI_LEVEL_LIST.length);
    expect(AQI_LEVELS.pm10).toHaveLength(AQI_LEVEL_LIST.length);
  });

  it('rosną monotonicznie i kończą się nieskończonością', () => {
    for (const type of ['pm25', 'pm10']) {
      const maxes = AQI_LEVELS[type].map(l => l.max);
      expect(maxes).toEqual([...maxes].sort((a, b) => a - b));
      expect(maxes.at(-1)).toBe(Infinity);
    }
  });

  it('odpowiadają tabeli EAQI Europejskiej Agencji Środowiska', () => {
    expect(AQI_LEVELS.pm25.map(l => l.max)).toEqual([5, 15, 50, 90, 140, Infinity]);
    expect(AQI_LEVELS.pm10.map(l => l.max)).toEqual([15, 45, 120, 195, 270, Infinity]);
  });
});

describe('calculateAQI', () => {
  it('zwraca „brak danych” gdy brakuje pomiaru', () => {
    expect(calculateAQI(0, 10).level).toBe('unknown');
    expect(calculateAQI(10, undefined).level).toBe('unknown');
  });

  it('klasyfikuje wartości graniczne jako niższy poziom (progi włącznie)', () => {
    expect(calculateAQI(5, 15).level).toBe('good');
    expect(calculateAQI(5.1, 15).level).toBe('fair');
    expect(calculateAQI(15, 45).level).toBe('fair');
    expect(calculateAQI(50, 120).level).toBe('moderate');
  });

  it('wybiera gorszy z dwóch wskaźników', () => {
    expect(calculateAQI(3, 100).level).toBe('moderate'); // PM10 decyduje
    expect(calculateAQI(60, 10).level).toBe('poor'); // PM2.5 decyduje
  });

  it('obsługuje bardzo wysokie stężenia', () => {
    expect(calculateAQI(500, 500).level).toBe('extremely-poor');
  });
});

describe('pomocnicze', () => {
  it('getPMColor zwraca kolor poziomu', () => {
    expect(getPMColor(2, 'pm25')).toBe(AQI_LEVEL_LIST[0].color);
    expect(getPMColor(200, 'pm10')).toBe(AQI_LEVEL_LIST[4].color);
    expect(getPMColor(1, 'nieznany')).toBe('#9ca3af');
  });

  it('describeRange opisuje zakresy', () => {
    expect(describeRange('pm25', 0)).toBe('0 – 5');
    expect(describeRange('pm25', 1)).toBe('> 5 – 15');
    expect(describeRange('pm10', 5)).toBe('> 270');
  });

  it('kolor tekstu daje kontrast WCAG AA (4,5:1) na każdym kolorze poziomu', () => {
    const lum = (hex) => {
      const ch = [1, 3, 5].map(i => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    for (const { color } of AQI_LEVEL_LIST) {
      const text = getReadableTextColor(color);
      const [a, b] = [lum(color), lum(text)].sort((x, y) => y - x);
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
