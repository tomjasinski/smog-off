import { describe, it, expect } from 'vitest';
import { computeBannerLayout, computeRowFit, BANNER_MIN, BANNER_MAX, MIN_SITE_NAME_SIZE } from '../lib/shareImage';

describe('computeRowFit', () => {
  it('przy małej liczbie wierszy pokazuje wszystkie i nic nie ukrywa', () => {
    const fit = computeRowFit(600, 5);
    expect(fit.shown).toBe(5);
    expect(fit.hidden).toBe(0);
  });

  it('przy dużej liczbie wierszy pokazuje tyle, ile się zmieści, a reszta jest ukryta', () => {
    const fit = computeRowFit(600, 80);
    expect(fit.shown).toBeGreaterThan(0);
    expect(fit.shown).toBeLessThan(80);
    expect(fit.hidden).toBe(80 - fit.shown);
    expect(fit.rowH).toBeGreaterThan(0);
  });

  it('wiersze razem z dopiskiem nie wchodzą na baner', () => {
    const startY = 600;
    const { shown, hidden, rowH } = computeRowFit(startY, 80);
    const end = startY + shown * (rowH + 14) + (hidden > 0 ? 44 : 0);
    expect(end).toBeLessThanOrEqual(1920 - 84 - BANNER_MIN);
  });
});

describe('computeBannerLayout', () => {
  it('nazwa strony nigdy nie jest mniejsza niż etykiety legendy (44 px)', () => {
    for (const contentEnd of [0, 800, 1400, 1600, 1700, 1800]) {
      expect(computeBannerLayout(contentEnd).siteNameSize).toBeGreaterThanOrEqual(MIN_SITE_NAME_SIZE);
    }
    expect(MIN_SITE_NAME_SIZE).toBeGreaterThan(44);
  });

  it('baner ma wysokość w granicach min-max', () => {
    for (const contentEnd of [0, 1000, 1500, 1700, 1850]) {
      const { height } = computeBannerLayout(contentEnd);
      expect(height).toBeGreaterThanOrEqual(BANNER_MIN);
      expect(height).toBeLessThanOrEqual(BANNER_MAX);
    }
  });

  it('wypełnia wolne miejsce: im wyżej kończy się treść, tym baner jest wyższy (do limitu)', () => {
    const low = computeBannerLayout(1700);
    const high = computeBannerLayout(1500);
    expect(high.height).toBeGreaterThan(low.height);
    expect(computeBannerLayout(500).height).toBe(BANNER_MAX);
    expect(computeBannerLayout(1900).height).toBe(BANNER_MIN);
  });

  it('baner kończy się nad linią ze źródłem danych i nie nachodzi na treść', () => {
    const contentEnd = 1500;
    const { top, height } = computeBannerLayout(contentEnd);
    expect(top).toBeGreaterThanOrEqual(contentEnd);
    expect(top + height).toBe(1920 - 84);
  });
});
