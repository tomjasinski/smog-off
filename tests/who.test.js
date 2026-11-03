import { describe, it, expect } from 'vitest';
import { compareWithWho, whoSummary, WHO_24H_LIMITS } from '../lib/who';
import { measurementAgeMinutes, AGING_HOURS } from '../lib/freshness';

describe('porównanie z normą WHO', () => {
  it('liczy krotność dobowej normy i przekroczenie', () => {
    expect(WHO_24H_LIMITS).toEqual({ pm25: 15, pm10: 45 });
    expect(compareWithWho(30, 'pm25')).toEqual({ value: 30, limit: 15, ratio: 2, exceeds: true });
    expect(compareWithWho(19, 'pm25').ratio).toBe(1.3);
    expect(compareWithWho(15, 'pm25').exceeds).toBe(false);
    expect(compareWithWho(37.4, 'pm10').exceeds).toBe(false);
  });

  it('podsumowuje oba wskaźniki', () => {
    const s = whoSummary(19, 37.4);
    expect(s.pm25.exceeds).toBe(true);
    expect(s.pm10.exceeds).toBe(false);
  });
});

describe('wiek pomiaru', () => {
  // 12:00 w Polsce zimą = 11:00 UTC
  const now = Date.UTC(2026, 0, 15, 11, 0, 0);

  it('liczy minuty od pomiaru (czas polski)', () => {
    expect(measurementAgeMinutes('2026-01-15 09:45:00', now)).toBe(135);
    expect(measurementAgeMinutes('2026-01-15 11:50:00', now)).toBe(10);
  });

  it('zwraca null dla nieczytelnego znacznika, a wiek nigdy nie jest ujemny', () => {
    expect(measurementAgeMinutes('brak', now)).toBeNull();
    expect(measurementAgeMinutes('2026-01-15 13:00:00', now)).toBe(0);
  });

  it('próg ostrzeżenia to 2 godziny', () => {
    expect(AGING_HOURS).toBe(2);
  });
});
