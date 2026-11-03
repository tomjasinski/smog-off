import { describe, it, expect } from 'vitest';
import { sortByMode } from '../lib/sorting';

const cities = [
  { name: 'Łódź', pm25: 30, pm10: 40 },
  { name: 'Gdańsk', pm25: 12, pm10: 20 },
  { name: 'Kraków', pm25: 30, pm10: 35 },
  { name: 'Białystok', pm25: 18, pm10: 25 }
];

describe('sortByMode', () => {
  it('alfabetycznie z polskimi znakami', () => {
    expect(sortByMode(cities, 'name').map((c) => c.name)).toEqual(['Białystok', 'Gdańsk', 'Kraków', 'Łódź']);
  });

  it('od najczystszych: PM2.5, a przy remisie PM10', () => {
    expect(sortByMode(cities, 'pm25-asc').map((c) => c.name)).toEqual(['Gdańsk', 'Białystok', 'Kraków', 'Łódź']);
  });

  it('od najbardziej zanieczyszczonych to odwrotna kolejność', () => {
    expect(sortByMode(cities, 'pm25-desc').map((c) => c.name)).toEqual(['Łódź', 'Kraków', 'Białystok', 'Gdańsk']);
  });

  it('nie zmienia oryginalnej tablicy', () => {
    const copy = [...cities];
    sortByMode(cities, 'name');
    expect(cities).toEqual(copy);
  });
});
