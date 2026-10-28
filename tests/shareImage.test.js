import { describe, it, expect } from 'vitest';
import { slugify } from '../lib/shareImage';

describe('slugify', () => {
  it('usuwa polskie znaki i spacje', () => {
    expect(slugify('Ranking punktów pomiarowych')).toBe('ranking-punktow-pomiarowych');
    expect(slugify('Jakość powietrza w Polsce')).toBe('jakosc-powietrza-w-polsce');
  });

  it('obsługuje ł i znaki specjalne', () => {
    expect(slugify('Łódź – top 10!')).toBe('lodz-top-10');
  });
});
