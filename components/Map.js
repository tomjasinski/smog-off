'use client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import MapLegend from './MapLegend';
import ShareStationButton from './ShareStationButton';
import StationArticles from './StationArticles';
import CityLink from './CityLink';
import BlogSheet from './BlogSheet';
import { buildMapStyle, TILEJSON_URL } from '../lib/mapStyle';
import { cityPageSlugs } from '../lib/cities';
import { getReadableTextColor, getPMColor } from '../lib/aqiLevels';
import styles from '../styles/Map.module.css';

// [zachód, południe, wschód, północ]
const POLAND_BOUNDS = [[13.5, 48.5], [24.8, 55.4]];
const EMPTY = { type: 'FeatureCollection', features: [] };

// Gdy w widoku jest nie więcej stacji, pokazujemy je wszystkie (bez klastrów); przy większym obszarze klastrujemy
const MAX_UNCLUSTERED_IN_VIEW = 20;
const CLUSTER_LAYERS = ['cl-circle', 'cl-count', 'pt'];

// Orientacyjny zasięg oddziaływania stacji (promień w metrach).
// Nie ma jednej normy: dyrektywa 2008/50/EC opisuje stacje tła miejskiego jako reprezentatywne dla
// obszaru rzędu kilku km², a badania przyjmują zwykle 1–2 km (np. kryterium różnicy <20% dla bufora 2 km).
const INFLUENCE_RADIUS_M = 1500;
const METERS_PER_PIXEL_Z0 = 78271.517; // kafelki 512 px, równik

const POINT_PAINT = {
  'circle-radius': 8,
  'circle-color': ['get', 'color'],
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 2.5
};

// Promień koła w pikselach rośnie z zoomem tak, by odpowiadał stałej odległości w metrach (z poprawką na szerokość geogr.)
const metersToPixels = (zoomFactor) => [
  '*',
  zoomFactor * (INFLUENCE_RADIUS_M / METERS_PER_PIXEL_Z0),
  ['/', 1, ['cos', ['*', ['get', 'lat'], ['/', ['pi'], 180]]]]
];

function MapInstructions({ map }) {
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    const hide = () => setShowTip(false);
    map.on('dragstart', hide);
    map.on('zoomstart', hide);
    map.on('click', hide);
    return () => {
      map.off('dragstart', hide);
      map.off('zoomstart', hide);
      map.off('click', hide);
    };
  }, [map]);

  if (!showTip) return null;

  return (
    <div className={styles.instructionTip}>
      <div className={styles.tipContent}>
        👆 Kliknij na punkt, aby zobaczyć szczegóły
      </div>
    </div>
  );
}

function circlePolygon(lng, lat, radiusKm, steps = 32) {
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (Math.sin(angle) * radiusKm) / 111.32;
    const dLng = (Math.cos(angle) * radiusKm) / (111.32 * Math.cos((lat * Math.PI) / 180));
    ring.push([lng + dLng, lat + dLat]);
  }
  return ring;
}

const stationFeature = (station) => ({
  type: 'Feature',
  properties: { id: String(station.id), color: station.aqi.color, lat: station.latitude },
  geometry: { type: 'Point', coordinates: [station.longitude, station.latitude] }
});

function LocationButton({ map, gl }) {
  const [locating, setLocating] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => () => markerRef.current?.remove(), []);

  const locateUser = () => {
    if (!('geolocation' in navigator)) {
      alert('Nie można określić lokalizacji: przeglądarka nie obsługuje geolokalizacji.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setLocationFound(true);
        const center = [coords.longitude, coords.latitude];

        map.getSource('me').setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [circlePolygon(center[0], center[1], coords.accuracy / 1000)] }
        });

        markerRef.current?.remove();
        const dot = document.createElement('div');
        dot.className = styles.userDot;
        markerRef.current = new gl.Marker({ element: dot })
          .setLngLat(center)
          .setPopup(new gl.Popup({ offset: 12 }).setText('📍 Twoja lokalizacja'))
          .addTo(map);
        markerRef.current.togglePopup();

        map.flyTo({ center, zoom: Math.min(Math.max(map.getZoom(), 11), 13) });
      },
      (error) => {
        setLocating(false);
        alert('Nie można określić lokalizacji: ' + error.message);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <button
      className={styles.locationButton}
      onClick={locateUser}
      disabled={locating}
      title="Znajdź moją lokalizację"
      aria-label="Znajdź moją lokalizację"
    >
      <svg
        className={locating ? styles.locatingIcon : undefined}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.5" fill={locationFound ? 'currentColor' : 'none'} />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}

function addMapLayers(map) {
  map.addSource('me', { type: 'geojson', data: EMPTY });
  map.addLayer({ id: 'me-accuracy', type: 'fill', source: 'me', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.12 } });

  // Strefa oddziaływania: koło o stałym promieniu w metrach, zanikające ku brzegowi (circle-blur),
  // dzięki czemu sąsiednie strefy się mieszają, a brzeg nie udaje ostrej granicy.
  map.addSource('stations-flat', { type: 'geojson', data: EMPTY });
  map.addLayer({
    id: 'influence', type: 'circle', source: 'stations-flat', minzoom: 8,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.17,
      'circle-blur': 1,
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 0, metersToPixels(1), 22, metersToPixels(4194304)]
    }
  });

  // Klasteryzacja po stronie MapLibre (worker), bez tysięcy elementów DOM
  map.addSource('stations-cl', { type: 'geojson', data: EMPTY, cluster: true, clusterRadius: 60, clusterMaxZoom: 12 });
  map.addLayer({
    id: 'cl-circle', type: 'circle', source: 'stations-cl', filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#111827',
      'circle-stroke-color': '#e5e7eb',
      'circle-stroke-width': 2,
      'circle-radius': ['step', ['get', 'point_count'], 16, 10, 19, 50, 23, 200, 27]
    }
  });
  map.addLayer({
    id: 'cl-count', type: 'symbol', source: 'stations-cl', filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 13,
      'text-allow-overlap': true
    },
    paint: { 'text-color': '#ffffff' }
  });
  map.addLayer({ id: 'pt', type: 'circle', source: 'stations-cl', filter: ['!', ['has', 'point_count']], paint: POINT_PAINT });
  // Wszystkie stacje bez klastrowania, włączane gdy w widoku jest ich niewiele
  map.addLayer({ id: 'pt-flat', type: 'circle', source: 'stations-flat', layout: { visibility: 'none' }, paint: POINT_PAINT });
}

export default function SmogMap({ posts }) {
  const [airData, setAirData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapError, setMapError] = useState(false);

  const containerRef = useRef(null);
  const glRef = useRef(null);
  const stationsByIdRef = useRef(new Map());
  const stationsListRef = useRef([]);
  const updateViewRef = useRef(null);
  const initialCenterRef = useRef([16.9252, 52.4064]);

  useEffect(() => {
    if (!selectedStation) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedStation(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedStation]);

  // Inicjalizacja mapy: biblioteka i TileJSON pobierane równolegle (oszczędza jedno żądanie w łańcuchu)
  useEffect(() => {
    let cancelled = false;
    let map;

    (async () => {
      const [mod, tilejson] = await Promise.all([
        import('maplibre-gl'),
        fetch(TILEJSON_URL).then((r) => r.json()).catch(() => null)
      ]);
      if (cancelled) return;
      const gl = mod.default ?? mod;
      glRef.current = gl;
      gl.setWorkerUrl('/maplibre-gl-worker.mjs');

      // Widok z adresu (np. link z podstrony miasta): ?lat=..&lng=..&zoom=..
      const params = new URLSearchParams(window.location.search);
      const viewLat = parseFloat(params.get('lat'));
      const viewLng = parseFloat(params.get('lng'));
      const viewZoom = parseFloat(params.get('zoom'));
      const hasView = Number.isFinite(viewLat) && Number.isFinite(viewLng);

      try {
        map = new gl.Map({
          container: containerRef.current,
          style: buildMapStyle(tilejson),
          center: hasView ? [viewLng, viewLat] : initialCenterRef.current,
          zoom: hasView && Number.isFinite(viewZoom) ? Math.min(Math.max(viewZoom, 6), 18) : 11,
          minZoom: 6,
          maxZoom: 18,
          maxBounds: POLAND_BOUNDS,
          renderWorldCopies: false,
          dragRotate: false,
          fadeDuration: 0,
          attributionControl: { compact: true }
        });
      } catch (error) {
        // Brak WebGL2 (stare urządzenie, wyłączona akceleracja): pokazujemy alternatywę w postaci listy
        console.error('Nie można uruchomić mapy:', error);
        setMapError(true);
        setLoading(false);
        return;
      }
      map.touchZoomRotate.disableRotation();
      map.addControl(new gl.NavigationControl({ showCompass: false }), 'top-left');

      map.on('load', () => {
        if (cancelled) return;
        addMapLayers(map);

        const hitTest = (point) => map.queryRenderedFeatures(point, { layers: ['cl-circle', 'pt', 'pt-flat'] })[0];

        // Do 20 stacji w widoku: wszystkie jako pojedyncze punkty, więcej: klastry
        let flatMode = false;
        const updateView = () => {
          const b = map.getBounds();
          let visible = 0;
          for (const s of stationsListRef.current) {
            if (s.longitude >= b.getWest() && s.longitude <= b.getEast() && s.latitude >= b.getSouth() && s.latitude <= b.getNorth()) {
              visible++;
              if (visible > MAX_UNCLUSTERED_IN_VIEW) break;
            }
          }
          const flat = visible > 0 && visible <= MAX_UNCLUSTERED_IN_VIEW;
          if (flat === flatMode) return;
          flatMode = flat;
          CLUSTER_LAYERS.forEach((id) => map.setLayoutProperty(id, 'visibility', flat ? 'none' : 'visible'));
          map.setLayoutProperty('pt-flat', 'visibility', flat ? 'visible' : 'none');
        };
        updateViewRef.current = updateView;
        map.on('moveend', updateView);

        map.on('click', (e) => {
          const feature = hitTest(e.point);
          if (!feature) return;
          if (feature.layer.id === 'cl-circle') {
            map.getSource('stations-cl')
              .getClusterExpansionZoom(feature.properties.cluster_id)
              .then((zoom) => map.easeTo({ center: feature.geometry.coordinates, zoom: zoom + 0.5 }));
            return;
          }
          const station = stationsByIdRef.current.get(feature.properties.id);
          if (station) setSelectedStation(station);
        });
        map.on('mousemove', (e) => {
          map.getCanvas().style.cursor = hitTest(e.point) ? 'pointer' : '';
        });

        setMapInstance(map);
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      updateViewRef.current = null;
      setMapInstance(null);
      if (map) map.remove();
    };
  }, []);

  // Dane stacji trafiają do źródeł GeoJSON (klastrowanego i płaskiego, dla stref oddziaływania)
  useEffect(() => {
    if (!mapInstance) return;
    const points = { type: 'FeatureCollection', features: airData.map(stationFeature) };
    stationsByIdRef.current = new Map(airData.map((s) => [String(s.id), s]));
    stationsListRef.current = airData;
    mapInstance.getSource('stations-cl').setData(points);
    mapInstance.getSource('stations-flat').setData(points);
    updateViewRef.current?.();
  }, [airData, mapInstance]);

  // Miasta z własną podstroną: nazwa w szczegółach stacji staje się linkiem
  const citySlugs = useMemo(() => cityPageSlugs(airData), [airData]);

  useEffect(() => {
    // Lokalizacja tylko, gdy zgoda została już wcześniej udzielona (bez pytania przy starcie).
    // W pozostałych przypadkach użytkownik używa przycisku lokalizacji.
    if ('geolocation' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state !== 'granted') return;
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              initialCenterRef.current = [coords.longitude, coords.latitude];
            },
            (error) => {
              console.log('Geolokalizacja niedostępna:', error.message);
            }
          );
        })
        .catch(() => {});
    }

    // Zapas: jeśli kafelki się nie załadują, i tak pobierz dane po 4 s
    const fallback = setTimeout(() => setMapReady(true), 4000);
    return () => clearTimeout(fallback);
  }, []);

  // Dane (ok. 600 KB) pobieramy dopiero po wyrenderowaniu mapy,
  // żeby nie blokować pierwszego malowania
  useEffect(() => {
    if (!mapReady) return;
    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, 300000);
    return () => clearInterval(interval);
  }, [mapReady]);

  async function fetchAirQuality() {
    try {
      const response = await fetch('/api/air-quality');
      const result = await response.json();

      if (result.data) {
        setAirData(result.data);
        console.log(`Załadowano ${result.data.length} stacji (cache: ${result.cached})`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={containerRef} className={styles.map} />

      {mapError && (
        <div className={styles.mapError} role="alert">
          <p>Nie udało się uruchomić mapy (wymagana jest obsługa WebGL2).</p>
          <Link href="/stacje">Zobacz listę stacji</Link>
        </div>
      )}

      {mapInstance && !loading && <MapInstructions map={mapInstance} />}
      {mapInstance && <LocationButton map={mapInstance} gl={glRef.current} />}

      {loading && (
        <div className={styles.dataLoading} role="status">
          Ładowanie danych o jakości powietrza…
        </div>
      )}

      <MapLegend />

      <BlogSheet posts={posts} />


      {selectedStation && (
        <div className={styles.detailOverlay} onClick={() => setSelectedStation(null)}>
          <div
            className={styles.detailContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="station-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedStation(null)}
              aria-label="Zamknij szczegóły stacji"
              autoFocus
            >
              <span aria-hidden="true">×</span>
            </button>

            <h2 id="station-dialog-title">{selectedStation.name}</h2>
            
            <div 
              className={styles.statusBadge} 
              style={{ backgroundColor: selectedStation.aqi.color, color: getReadableTextColor(selectedStation.aqi.color) }}
            >
              {selectedStation.aqi.label}
            </div>

            <div className={styles.dataGrid}>
              <div 
                className={styles.dataItem}
                style={{ 
                  borderLeft: `4px solid ${getPMColor(selectedStation.data.pm25, 'pm25')}` 
                }}
              >
                <span className={styles.label}>PM2.5</span>
                <span 
                  className={styles.value}
                  style={{ color: getPMColor(selectedStation.data.pm25, 'pm25') }}
                >
                  {selectedStation.data.pm25.toFixed(1)} µg/m³
                </span>
              </div>
              
              <div 
                className={styles.dataItem}
                style={{ 
                  borderLeft: `4px solid ${getPMColor(selectedStation.data.pm10, 'pm10')}` 
                }}
              >
                <span className={styles.label}>PM10</span>
                <span 
                  className={styles.value}
                  style={{ color: getPMColor(selectedStation.data.pm10, 'pm10') }}
                >
                  {selectedStation.data.pm10.toFixed(1)} µg/m³
                </span>
              </div>
              
              <div className={styles.dataItem}>
                <span className={styles.label}>🌡️ Temperatura</span>
                <span className={styles.value}>{selectedStation.data.temperature.toFixed(1)}°C</span>
              </div>
              
              <div className={styles.dataItem}>
                <span className={styles.label}>💧 Wilgotność</span>
                <span className={styles.value}>{selectedStation.data.humidity.toFixed(0)}%</span>
              </div>
              
              <div className={styles.dataItem}>
                <span className={styles.label}>🌀 Ciśnienie</span>
                <span className={styles.value}>{selectedStation.data.pressure.toFixed(0)} hPa</span>
              </div>
            </div>

            <ShareStationButton station={selectedStation} />

            <div className={styles.location}>
              <p><strong>📍 Lokalizacja:</strong></p>
              <p><CityLink name={selectedStation.city} slugs={citySlugs} className={styles.cityLink} /></p>
              {selectedStation.street && <p>{selectedStation.street}</p>}
            </div>
            <StationArticles level={selectedStation.aqi.level} posts={posts} />


            <div className={styles.timestamp}>
              ⏱️ Aktualizacja: {new Date(selectedStation.timestamp).toLocaleString('pl-PL')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
