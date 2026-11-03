// Odchudzony styl MapLibre na kafelkach OpenFreeMap (schemat OpenMapTiles, OSM, bez klucza API) w dwóch wariantach: ciemnym i jasnym.
// Zawiera tylko to, co jest potrzebne do orientacji: tło, wodę, główne drogi, granice i nazwy miejscowości.
// Brak sprite'ów, budynków, kolei, lotnisk, nazw ulic i POI, więc kafelki renderują się szybko.
export const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const FONT = ['Noto Sans Regular'];

export const MAP_PALETTES = {
  dark: {
    background: '#0b0e13',
    water: '#141d2a',
    urban: '#10151c',
    roadMajor: '#273040',
    roadMinor: '#1a212c',
    boundaryCountry: '#46546a',
    boundaryState: '#222b38',
    label: '#a7b2c2',
    labelHalo: '#0b0e13',
    // warstwy stacji
    clusterFill: '#111827',
    clusterStroke: '#e5e7eb',
    clusterText: '#ffffff',
    pointStroke: '#ffffff',
    influenceOpacity: 0.17
  },
  light: {
    background: '#eef1f5',
    water: '#c6dbef',
    urban: '#e4e8ee',
    roadMajor: '#c9d1dc',
    roadMinor: '#dce1e8',
    boundaryCountry: '#8794a7',
    boundaryState: '#c5ccd6',
    label: '#374151',
    labelHalo: '#f9fafb',
    clusterFill: '#ffffff',
    clusterStroke: '#374151',
    clusterText: '#111827',
    pointStroke: '#1f2937',
    influenceOpacity: 0.3
  }
};

const isPolygon = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];

const roadWidth = (base) => ['interpolate', ['exponential', 1.4], ['zoom'], 6, base * 0.4, 12, base, 18, base * 6];

const placeLabel = (id, cls, minzoom, size, colors) => ({
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
    'text-color': colors.label,
    'text-halo-color': colors.labelHalo,
    'text-halo-width': 1.5
  }
});

// tilejson (opcjonalnie): gdy pobraliśmy go wcześniej równolegle z biblioteką, oszczędzamy jedno żądanie
export function buildMapStyle(tilejson, theme = 'dark') {
  const colors = MAP_PALETTES[theme] || MAP_PALETTES.dark;
  const source = tilejson
    ? { type: 'vector', tiles: tilejson.tiles, minzoom: tilejson.minzoom, maxzoom: tilejson.maxzoom, attribution: tilejson.attribution }
    : { type: 'vector', url: TILEJSON_URL };

  return {
    version: 8,
    name: `smogoff-${theme}`,
    glyphs: GLYPHS_URL,
    sources: { openmaptiles: source },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': colors.background } },
      {
        id: 'landuse-urban',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        minzoom: 8,
        filter: ['all', isPolygon, ['match', ['get', 'class'], ['residential', 'commercial', 'industrial'], true, false]],
        paint: { 'fill-color': colors.urban }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['all', isPolygon, ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'fill-color': colors.water }
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        minzoom: 9,
        filter: isLine,
        paint: { 'line-color': colors.water, 'line-width': roadWidth(1) }
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['all', isLine, ['match', ['get', 'class'], ['secondary', 'tertiary', 'minor', 'service'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'line-color': colors.roadMinor, 'line-width': roadWidth(0.8) }
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 6,
        filter: ['all', isLine, ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colors.roadMajor, 'line-width': roadWidth(1.2) }
      },
      {
        id: 'boundary-state',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        minzoom: 5,
        filter: ['==', ['get', 'admin_level'], 4],
        paint: { 'line-color': colors.boundaryState, 'line-width': 1 }
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!', ['has', 'claimed_by']]],
        paint: { 'line-color': colors.boundaryCountry, 'line-width': 1.2 }
      },
      placeLabel('place-village', 'village', 11, [10, 12], colors),
      placeLabel('place-town', 'town', 8, [11, 14], colors),
      placeLabel('place-city', 'city', 4, [12, 17], colors)
    ]
  };
}

// Zmienia kolory już załadowanej mapy (styl bazowy i warstwy stacji) bez przeładowania stylu i kafelków
export function applyMapTheme(map, theme) {
  const c = MAP_PALETTES[theme] || MAP_PALETTES.dark;
  const set = (layer, prop, value) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop, value);
  };
  set('background', 'background-color', c.background);
  set('landuse-urban', 'fill-color', c.urban);
  set('water', 'fill-color', c.water);
  set('waterway', 'line-color', c.water);
  set('road-minor', 'line-color', c.roadMinor);
  set('road-major', 'line-color', c.roadMajor);
  set('boundary-state', 'line-color', c.boundaryState);
  set('boundary-country', 'line-color', c.boundaryCountry);
  ['place-village', 'place-town', 'place-city'].forEach((id) => {
    set(id, 'text-color', c.label);
    set(id, 'text-halo-color', c.labelHalo);
  });
  // warstwy stacji (dodawane po załadowaniu stylu)
  set('cl-circle', 'circle-color', c.clusterFill);
  set('cl-circle', 'circle-stroke-color', c.clusterStroke);
  set('cl-count', 'text-color', c.clusterText);
  set('pt', 'circle-stroke-color', c.pointStroke);
  set('pt-flat', 'circle-stroke-color', c.pointStroke);
  set('influence', 'circle-opacity', c.influenceOpacity);
}
