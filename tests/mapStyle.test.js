import { describe, it, expect } from 'vitest';
import { MAP_PALETTES, buildMapStyle } from '../lib/mapStyle';

describe('mapStyle', () => {
  it('ma te same klucze w paletach ciemnej i jasnej', () => {
    expect(Object.keys(MAP_PALETTES.light).sort()).toEqual(Object.keys(MAP_PALETTES.dark).sort());
  });

  it('buduje styl z kolorami wybranego motywu', () => {
    for (const theme of ['dark', 'light']) {
      const style = buildMapStyle(null, theme);
      const background = style.layers.find((l) => l.id === 'background');
      const water = style.layers.find((l) => l.id === 'water');
      expect(background.paint['background-color']).toBe(MAP_PALETTES[theme].background);
      expect(water.paint['fill-color']).toBe(MAP_PALETTES[theme].water);
    }
  });

  it('dla nieznanego motywu używa ciemnego', () => {
    const style = buildMapStyle(null, 'nieznany');
    expect(style.layers.find((l) => l.id === 'background').paint['background-color']).toBe(MAP_PALETTES.dark.background);
  });

  it('używa TileJSON z kafelkami, gdy jest dostępny', () => {
    const style = buildMapStyle({ tiles: ['https://example.test/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14, attribution: 'x' });
    expect(style.sources.openmaptiles.tiles).toEqual(['https://example.test/{z}/{x}/{y}.pbf']);
    expect(style.sources.openmaptiles.url).toBeUndefined();
  });
});
