import { describe, it, expect } from 'vitest';
import { titleCasePl, citySlug, groupCities, MIN_STATIONS_FOR_CITY_PAGE } from '../lib/cities';

const station = (city, pm25, pm10 = pm25 + 5) => ({
  id: `${city}-${pm25}`,
  name: 'Stacja',
  city,
  data: { pm25, pm10 }
});

describe('titleCasePl', () => {
  it('zamienia wielkie litery na zwykłą pisownię', () => {
    expect(titleCasePl('POZNAŃ')).toBe('Poznań');
    expect(titleCasePl('OSTROWIEC ŚWIĘTOKRZYSKI')).toBe('Ostrowiec Świętokrzyski');
    expect(titleCasePl('BIELSKO-BIAŁA')).toBe('Bielsko-Biała');
  });

  it('obsługuje polskie litery na początku słowa', () => {
    expect(titleCasePl('ŁÓDŹ')).toBe('Łódź');
    expect(titleCasePl('  ŚWIDNICA ')).toBe('Świdnica');
  });
});

describe('citySlug', () => {
  it('tworzy adres bez polskich znaków', () => {
    expect(citySlug('Łódź')).toBe('lodz');
    expect(citySlug('Bielsko-Biała')).toBe('bielsko-biala');
    expect(citySlug('Ostrowiec Świętokrzyski')).toBe('ostrowiec-swietokrzyski');
  });
});

describe('groupCities', () => {
  const five = (city, base = 10) => [0, 1, 2, 3, 4].map((i) => station(city, base + i));

  it('zwraca tylko miasta z wymaganą liczbą stacji', () => {
    const stations = [...five('POZNAŃ'), ...five('KOŁO').slice(0, 4)];
    const cities = groupCities(stations);
    expect(cities.map((c) => c.name)).toEqual(['Poznań']);
    expect(MIN_STATIONS_FOR_CITY_PAGE).toBe(5);
  });

  it('scala różną wielkość liter w nazwie miasta', () => {
    const stations = [station('Poznań', 10), station('POZNAŃ', 11), station('poznań', 12), station('Poznań ', 13), station('POZNAŃ', 14)];
    const cities = groupCities(stations);
    expect(cities).toHaveLength(1);
    expect(cities[0].count).toBe(5);
  });

  it('liczy medianę i poziom jakości', () => {
    const cities = groupCities(five('GLIWICE', 20));
    expect(cities[0].pm25).toBe(22);
    expect(cities[0].pm10).toBe(27);
    expect(cities[0].slug).toBe('gliwice');
    expect(cities[0].aqi.level).toBe('moderate');
  });

  it('pomija podejrzane odczyty poniżej 1 µg/m³', () => {
    const stations = [...five('TARNÓW'), station('TARNÓW', 0.4, 0.5)];
    expect(groupCities(stations)[0].count).toBe(5);
  });

  it('pomija stacje bez nazwy miasta', () => {
    expect(groupCities([...five(''), ...five('  ')])).toEqual([]);
  });

  it('sortuje miasta alfabetycznie z polskimi znakami', () => {
    const stations = [...five('ŻYWIEC'), ...five('ŁÓDŹ'), ...five('ZABRZE'), ...five('LUBLIN')];
    expect(groupCities(stations).map((c) => c.name)).toEqual(['Lublin', 'Łódź', 'Zabrze', 'Żywiec']);
  });
});
