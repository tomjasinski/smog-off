import { describe, it, expect } from 'vitest';
import { pickPostsForLevel, contextHeading } from '../lib/contextualPosts';

const posts = [
  'czym-jest-pm25-pm10',
  'tani-czujnik-zawyza-pm25',
  'jak-chronic-sie-przed-smogiem',
  'smog-a-zdrowie-dzieci'
].map((slug) => ({ slug, title: slug }));

describe('pickPostsForLevel', () => {
  it('proponuje artykuły o ochronie przy złym powietrzu', () => {
    const slugs = pickPostsForLevel('very-poor', posts).map((p) => p.slug);
    expect(slugs).toEqual(['jak-chronic-sie-przed-smogiem', 'smog-a-zdrowie-dzieci']);
  });

  it('proponuje artykuły wprowadzające przy dobrym powietrzu', () => {
    const slugs = pickPostsForLevel('good', posts).map((p) => p.slug);
    expect(slugs).toEqual(['czym-jest-pm25-pm10', 'tani-czujnik-zawyza-pm25']);
  });

  it('pomija artykuły, których nie ma na liście', () => {
    const only = posts.filter((p) => p.slug === 'smog-a-zdrowie-dzieci');
    expect(pickPostsForLevel('poor', only).map((p) => p.slug)).toEqual(['smog-a-zdrowie-dzieci']);
  });

  it('zwraca pustą listę dla nieznanego poziomu', () => {
    expect(pickPostsForLevel('unknown', posts)).toEqual([]);
  });

  it('respektuje limit', () => {
    expect(pickPostsForLevel('poor', posts, 1)).toHaveLength(1);
  });
});

describe('contextHeading', () => {
  it('zwraca nagłówek zależny od poziomu', () => {
    expect(contextHeading('poor')).toBe('Jak się chronić');
    expect(contextHeading('good')).toBe('Warto wiedzieć');
    expect(contextHeading('nieznany')).toBe('Warto wiedzieć');
  });
});
