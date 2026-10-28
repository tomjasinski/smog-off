import { describe, it, expect } from 'vitest';
import { computeBannerLayout, BANNER_MIN, BANNER_MAX, MIN_SITE_NAME_SIZE } from '../lib/shareImage';

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
