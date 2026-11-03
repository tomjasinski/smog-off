import { describe, it, expect } from 'vitest';
import en from '../lib/locales/en';
import { translate } from '../lib/i18n';
import { AQI_LEVEL_LIST } from '../lib/aqiLevels';
import { extractKeys } from './helpers/i18nKeys';

describe('tłumaczenia', () => {
  it('każdy tekst przekazany do t() w kodzie ma angielskie tłumaczenie', () => {
    const missing = [...extractKeys().entries()]
      .filter(([key]) => !(key in en))
      .map(([key, files]) => `${key}  (${[...new Set(files)].join(', ')})`);
    expect(missing).toEqual([]);
  });

  it('teksty wybierane dynamicznie (poziomy jakości powietrza) są przetłumaczone', () => {
    for (const { label } of AQI_LEVEL_LIST) expect(en[label], label).toBeTruthy();
    expect(en['Brak danych']).toBeTruthy();
  });

  it('tłumaczenia mają te same miejsca na wartości co oryginał', () => {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [key, value] of Object.entries(en)) {
      expect(placeholders(value), key).toEqual(placeholders(key));
    }
  });

  it('żadne tłumaczenie nie jest puste', () => {
    for (const [key, value] of Object.entries(en)) expect(value.trim(), key).not.toBe('');
  });
});

describe('translate', () => {
  it('zwraca polski tekst dla polskiego i brakującego tłumaczenia', () => {
    expect(translate('pl', 'Dobra')).toBe('Dobra');
    expect(translate('en', 'tekst bez tłumaczenia')).toBe('tekst bez tłumaczenia');
  });

  it('tłumaczy na angielski i podstawia wartości', () => {
    expect(translate('en', 'Dobra')).toBe('Good');
    expect(translate('en', 'stacji: {count}', { count: 5 })).toBe('stations: 5');
    expect(translate('pl', 'stacji: {count}', { count: 5 })).toBe('stacji: 5');
  });

  it('zostawia nieznane miejsca na wartości bez zmian', () => {
    expect(translate('pl', 'a {x} b', {})).toBe('a {x} b');
  });
});

describe('teksty wybierane dynamicznie z list', () => {
  it('opcje sortowania mają tłumaczenie', async () => {
    const { QUALITY_SORT_OPTIONS } = await import('../lib/sorting');
    for (const { label } of QUALITY_SORT_OPTIONS) expect(en[label], label).toBeTruthy();
  });
});
