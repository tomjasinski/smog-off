// Odchudzony, ciemny styl MapLibre na kafelkach OpenFreeMap (schemat OpenMapTiles, OSM, bez klucza API).
// Zawiera tylko to, co jest potrzebne do orientacji: tło, wodę, główne drogi, granice i nazwy miejscowości.
// Brak sprite'ów, budynków, kolei, lotnisk, nazw ulic i POI, więc kafelki renderują się szybko.
export const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const FONT = ['Noto Sans Regular'];

const COLORS = {
  background: '#0b0e13',
  water: '#141d2a',
  urban: '#10151c',
  roadMajor: '#273040',
  roadMinor: '#1a212c',
  boundaryCountry: '#46546a',
  boundaryState: '#222b38',
  label: '#a7b2c2',
  labelHalo: '#0b0e13'
};

const isPolygon = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];

const roadWidth = (base) => ['interpolate', ['exponential', 1.4], ['zoom'], 6, base * 0.4, 12, base, 18, base * 6];

const placeLabel = (id, cls, minzoom, size) => ({
  id,
  type: 'symbol',
  source: 'openmaptiles',
  'source-layer': 'place',
  minzoom,
  filter: ['==', ['get', 'class'], cls],
  layout: {
    'text-field': ['coalesce', ['get', 'name:pl'], ['get', 'name']],
    'text-font': FONT,
    'text-size': ['interpolate', ['linear'], ['zoom'], minzoom, size[0], minzoom + 4, size[1]],
    'symbol-sort-key': ['get', 'rank']
  },
  paint: {
    'text-color': COLORS.label,
    'text-halo-color': COLORS.labelHalo,
    'text-halo-width': 1.5
  }
});

// tilejson (opcjonalnie): gdy pobraliśmy go wcześniej równolegle z biblioteką, oszczędzamy jedno żądanie
export function buildMapStyle(tilejson) {
  const source = tilejson
    ? { type: 'vector', tiles: tilejson.tiles, minzoom: tilejson.minzoom, maxzoom: tilejson.maxzoom, attribution: tilejson.attribution }
    : { type: 'vector', url: TILEJSON_URL };

  return {
    version: 8,
    name: 'smogoff-dark',
    glyphs: GLYPHS_URL,
    sources: { openmaptiles: source },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': COLORS.background } },
      {
        id: 'landuse-urban',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        minzoom: 8,
        filter: ['all', isPolygon, ['match', ['get', 'class'], ['residential', 'commercial', 'industrial'], true, false]],
        paint: { 'fill-color': COLORS.urban }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['all', isPolygon, ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'fill-color': COLORS.water }
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        minzoom: 9,
        filter: isLine,
        paint: { 'line-color': COLORS.water, 'line-width': roadWidth(1) }
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['all', isLine, ['match', ['get', 'class'], ['secondary', 'tertiary', 'minor', 'service'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'line-color': COLORS.roadMinor, 'line-width': roadWidth(0.8) }
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 6,
        filter: ['all', isLine, ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLORS.roadMajor, 'line-width': roadWidth(1.2) }
      },
      {
        id: 'boundary-state',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        minzoom: 5,
        filter: ['==', ['get', 'admin_level'], 4],
        paint: { 'line-color': COLORS.boundaryState, 'line-width': 1 }
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!', ['has', 'claimed_by']]],
        paint: { 'line-color': COLORS.boundaryCountry, 'line-width': 1.2 }
      },
      placeLabel('place-village', 'village', 11, [10, 12]),
      placeLabel('place-town', 'town', 8, [11, 14]),
      placeLabel('place-city', 'city', 4, [12, 17])
    ]
  };
}
