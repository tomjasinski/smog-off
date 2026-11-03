import { describe, it, expect } from 'vitest';
import { normalizeView, normalizeFavorites, toggleFavorite, MAX_FAVORITES } from '../lib/preferences';

describe('normalizeView', () => {
  it('przyjmuje poprawny widok i ogranicza zoom do zakresu mapy', () => {
    expect(normalizeView({ lat: 52.4, lng: 16.9, zoom: 11.5 })).toEqual({ lat: 52.4, lng: 16.9, zoom: 11.5 });
    expect(normalizeView({ lat: 52.4, lng: 16.9, zoom: 30 }).zoom).toBe(18);
    expect(normalizeView({ lat: 52.4, lng: 16.9, zoom: 1 }).zoom).toBe(6);
  });

  it('odrzuca brak i uszkodzone dane', () => {
    expect(normalizeView(null)).toBeNull();
    expect(normalizeView({ lat: 'x', lng: 16.9, zoom: 11 })).toBeNull();
    expect(normalizeView({ lat: 120, lng: 16.9, zoom: 11 })).toBeNull();
    expect(normalizeView({ lat: 52, lng: 16.9 })).toBeNull();
  });
});

describe('normalizeFavorites', () => {
  it('zostawia poprawne wpisy, usuwa duplikaty i ucina do limitu', () => {
    const raw = [{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }, { id: 2, name: 'B' }, null, { name: 'bez id' }, { id: 'c' }, { id: 'd' }];
    expect(normalizeFavorites(raw)).toEqual([
      { id: 'a', name: 'A' },
      { id: '2', name: 'B' },
      { id: 'c', name: '' }
    ]);
  });

  it('zwraca pustą listę dla czegoś, co nie jest tablicą', () => {
    expect(normalizeFavorites('abc')).toEqual([]);
    expect(normalizeFavorites(null)).toEqual([]);
  });
});

describe('toggleFavorite', () => {
  it('dodaje, usuwa i pilnuje limitu', () => {
    let list = [];
    for (const id of ['1', '2', '3']) {
      const res = toggleFavorite(list, { id, name: `S${id}` });
      expect(res.status).toBe('added');
      list = res.list;
    }
    expect(list).toHaveLength(MAX_FAVORITES);

    const full = toggleFavorite(list, { id: '4', name: 'S4' });
    expect(full.status).toBe('full');
    expect(full.list).toBe(list);

    const removed = toggleFavorite(list, { id: '2', name: 'S2' });
    expect(removed.status).toBe('removed');
    expect(removed.list.map((f) => f.id)).toEqual(['1', '3']);
  });

  it('porównuje id jako tekst', () => {
    const { list } = toggleFavorite([], { id: 7, name: 'S' });
    expect(toggleFavorite(list, { id: '7', name: 'S' }).status).toBe('removed');
  });
});
