import { describe, it, expect } from 'vitest';
import { normalizeSettings, resolveStart, applySettings, DEFAULT_SETTINGS } from '../lib/settings';

describe('normalizeSettings', () => {
  it('daje wartości domyślne dla braku i śmieci', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('abc')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ theme: 'neon', palette: 5, contrast: {}, touch: null, textSize: 'huge', motion: 1, zones: 'yes', start: 'x' })).toEqual(DEFAULT_SETTINGS);
  });

  it('zachowuje poprawne wartości', () => {
    const s = normalizeSettings({ theme: 'dark', palette: 'cvd', contrast: 'high', touch: 'large', textSize: 'large', motion: 'reduce', zones: false });
    expect(s).toMatchObject({ theme: 'dark', palette: 'cvd', contrast: 'high', touch: 'large', textSize: 'large', motion: 'reduce', zones: false });
  });

  it('miejsce startu wymaga współrzędnych, inaczej wraca do ostatniego widoku', () => {
    expect(normalizeSettings({ start: { mode: 'city', label: 'Gdańsk' } }).start).toEqual({ mode: 'last' });
    expect(normalizeSettings({ start: { mode: 'city', lat: 200, lng: 18 } }).start).toEqual({ mode: 'last' });
    expect(normalizeSettings({ start: { mode: 'city', lat: 54.35, lng: 18.65, zoom: 40, label: 'Gdańsk' } }).start).toEqual({
      mode: 'city', lat: 54.35, lng: 18.65, zoom: 18, label: 'Gdańsk'
    });
    expect(normalizeSettings({ start: { mode: 'station', lat: 52, lng: 17, id: 12 } }).start.id).toBe('12');
  });
});

describe('resolveStart', () => {
  const last = { lat: 50, lng: 20, zoom: 9 };

  it('last: ostatni widok albo null', () => {
    expect(resolveStart(normalizeSettings({ start: { mode: 'last' } }), last)).toBe(last);
    expect(resolveStart(normalizeSettings({}), null)).toBeNull();
  });

  it('default: null (domyślnie Poznań)', () => {
    expect(resolveStart(normalizeSettings({ start: { mode: 'default' } }), last)).toBeNull();
  });

  it('city / fixed: zapisane współrzędne, niezależnie od ostatniego widoku', () => {
    const s = normalizeSettings({ start: { mode: 'fixed', lat: 51.1, lng: 17.03, zoom: 13 } });
    expect(resolveStart(s, last)).toEqual({ lat: 51.1, lng: 17.03, zoom: 13 });
  });
});

describe('applySettings', () => {
  const fakeRoot = () => {
    const attrs = new Map();
    return {
      attrs,
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k)
    };
  };

  it('motyw systemowy zdejmuje data-theme, a pozostałe ustawia', () => {
    const root = fakeRoot();
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark', contrast: 'high', touch: 'large', textSize: 'large', motion: 'reduce' }, root);
    expect(Object.fromEntries(root.attrs)).toEqual({
      'data-theme': 'dark', 'data-contrast': 'high', 'data-touch': 'large', 'data-text': 'large', 'data-motion': 'reduce'
    });
    applySettings(DEFAULT_SETTINGS, root);
    expect(root.attrs.has('data-theme')).toBe(false);
    expect(root.attrs.get('data-contrast')).toBe('normal');
  });
});
