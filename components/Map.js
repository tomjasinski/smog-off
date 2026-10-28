'use client';
import { MapContainer, TileLayer, CircleMarker, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Delaunay } from 'd3-delaunay';
import Link from 'next/link';
import StatsOverlay from './StatsOverlay';
import { getPMColor, getReadableTextColor } from '../lib/aqiLevels';
import styles from '../styles/Map.module.css';

const POLAND_BOUNDS = [[48.5, 13.5], [55.4, 24.8]];

function MapInstructions() {
  const [showTip, setShowTip] = useState(true);
  
  useMapEvents({
    drag: () => setShowTip(false),
    zoom: () => setShowTip(false),
    click: () => setShowTip(false),
  });

  if (!showTip) return null;

  return (
    <div className={styles.instructionTip}>
      <div className={styles.tipContent}>
        👆 Kliknij na punkt, aby zobaczyć szczegóły
      </div>
    </div>
  );
}

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [locationFound, setLocationFound] = useState(false);

  const locateUser = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 11 });
  };

  useEffect(() => {
    const onLocationFound = (e) => {
      setLocating(false);
      setLocationFound(true);
      
      const marker = L.circleMarker(e.latlng, {
        radius: 10,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 3,
        fillOpacity: 0.8
      }).addTo(map);
      
      marker.bindPopup('📍 Twoja lokalizacja').openPopup();
      L.circle(e.latlng, { radius: e.accuracy, fillOpacity: 0.1, color: '#3b82f6' }).addTo(map);
    };

    const onLocationError = (e) => {
      setLocating(false);
      alert('Nie można określić lokalizacji: ' + e.message);
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
    };
  }, [map]);

  return (
    <button 
      className={styles.locationButton}
      onClick={locateUser}
      disabled={locating}
      title="Znajdź moją lokalizację"
      aria-label="Znajdź moją lokalizację"
    >
      <span aria-hidden="true">{locating ? '🔄' : locationFound ? '📍' : '🎯'}</span>
    </button>
  );
}

function BlogFloatingCards({ posts }) {
  const scrollRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const shuffledPosts = useMemo(() => {
    return [...posts].sort(() => Math.random() - 0.5);
  }, [posts]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const updateEdges = () => {
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      setEdges({
        atStart: scrollContainer.scrollLeft <= 1,
        atEnd: scrollContainer.scrollLeft >= maxScroll - 1
      });
    };

    // Kółko myszy przewija karty poziomo, ale na brzegach oddaje przewijanie stronie
    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const canScroll = e.deltaY < 0
        ? scrollContainer.scrollLeft > 0
        : scrollContainer.scrollLeft < maxScroll;
      if (!canScroll) return;
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    };

    updateEdges();
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    scrollContainer.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
      scrollContainer.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, []);

  const scrollByPage = (direction) => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollContainer.scrollBy({
      left: direction * scrollContainer.clientWidth * 0.8,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  };

  return (
    <div className={styles.floatingBlogWrapper} role="region" aria-label="Artykuły o jakości powietrza">
      <button
        type="button"
        className={`${styles.blogScrollButton} ${styles.blogScrollLeft}`}
        onClick={() => scrollByPage(-1)}
        disabled={edges.atStart}
        aria-label="Pokaż poprzednie artykuły"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <div className={styles.floatingBlogCards} ref={scrollRef}>
        {shuffledPosts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={styles.floatingCard}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={styles.floatingCardContent}>
              <span className={styles.floatingIcon} aria-hidden="true">📝</span>
              <span className={styles.floatingTitle}>{post.title}</span>
            </div>
          </Link>
        ))}
      </div>
      <button
        type="button"
        className={`${styles.blogScrollButton} ${styles.blogScrollRight}`}
        onClick={() => scrollByPage(1)}
        disabled={edges.atEnd}
        aria-label="Pokaż kolejne artykuły"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

function VisibleMarkersTracker({ stations, onVisibleChange }) {
  const map = useMap();

  useMapEvents({
    moveend: () => updateVisibleMarkers(),
    zoomend: () => updateVisibleMarkers()
  });

  // Rysujemy tylko stacje w widoku (z zapasem 50%), a nie wszystkie ~1600
  const updateVisibleMarkers = () => {
    const bounds = map.getBounds();
    const padded = bounds.pad(0.5);
    const inView = [];
    let visibleCount = 0;

    for (const station of stations) {
      const point = [station.latitude, station.longitude];
      if (!padded.contains(point)) continue;
      inView.push(station);
      if (bounds.contains(point)) visibleCount++;
    }

    onVisibleChange(inView, visibleCount);
  };

  useEffect(() => {
    updateVisibleMarkers();
  }, [stations]);

  return null;
}

function VoronoiLayer({ stations, onStationClick, enabled }) {
  const map = useMap();
  const [voronoiPolygons, setVoronoiPolygons] = useState([]);

  const updateVoronoi = () => {
    if (!enabled || stations.length < 5) {
      setVoronoiPolygons([]);
      return;
    }

    try {
      const bounds = map.getBounds();
      const padding = 500;
      
      const sw = map.latLngToLayerPoint(bounds.getSouthWest());
      const ne = map.latLngToLayerPoint(bounds.getNorthEast());
      
      const minX = sw.x - padding;
      const maxX = ne.x + padding;
      const minY = ne.y - padding;
      const maxY = sw.y + padding;

      // Jeśli jest tylko 1-2 punkty, stwórz okręgi zamiast Woronoja
      if (stations.length === 1) {
        const station = stations[0];
        const center = map.latLngToLayerPoint([station.latitude, station.longitude]);
        
        // Stwórz okrąg wokół pojedynczego punktu
        const radius = 5000; // 5km w metrach
        const circle = [];
        const numPoints = 32;
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const dx = Math.cos(angle) * radius;
          const dy = Math.sin(angle) * radius;
          
          const lat = station.latitude + (dy / 111320);
          const lng = station.longitude + (dx / (111320 * Math.cos(station.latitude * Math.PI / 180)));
          
          circle.push([lat, lng]);
        }
        
        setVoronoiPolygons([{
          positions: circle,
          station: station,
          color: station.aqi.color
        }]);
        return;
      }

      if (stations.length === 2) {
        // Dla dwóch punktów stwórz po jednym okręgu dla każdego
        const polygons = stations.map(station => {
          const radius = 5000;
          const circle = [];
          const numPoints = 32;
          
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius;
            
            const lat = station.latitude + (dy / 111320);
            const lng = station.longitude + (dx / (111320 * Math.cos(station.latitude * Math.PI / 180)));
            
            circle.push([lat, lng]);
          }
          
          return {
            positions: circle,
            station: station,
            color: station.aqi.color
          };
        });
        
        setVoronoiPolygons(polygons);
        return;
      }

      // Dla 3+ punktów używamy prawdziwego Woronoja
      const points = stations.map(station => {
        const point = map.latLngToLayerPoint([station.latitude, station.longitude]);
        return [point.x, point.y, station];
      });

      // Dodaj pomocnicze punkty na rogach
      const corners = [
        [minX, minY, null],
        [maxX, minY, null],
        [minX, maxY, null],
        [maxX, maxY, null],
        [minX + (maxX - minX) / 2, minY, null],
        [minX + (maxX - minX) / 2, maxY, null],
        [minX, minY + (maxY - minY) / 2, null],
        [maxX, minY + (maxY - minY) / 2, null],
      ];

      const allPoints = [...points, ...corners];

      const delaunay = Delaunay.from(allPoints);
      const voronoi = delaunay.voronoi([minX, minY, maxX, maxY]);

      const polygons = [];
      for (let i = 0; i < points.length; i++) {
        const cell = voronoi.cellPolygon(i);
        if (!cell) continue;

        const station = points[i][2];
        const limitedCell = [];
        const MAX_DISTANCE_KM = 5;

        for (const [x, y] of cell) {
          const latLng = map.layerPointToLatLng([x, y]);
          const distance = getDistance(
            station.latitude,
            station.longitude,
            latLng.lat,
            latLng.lng
          );

          if (distance > MAX_DISTANCE_KM) {
            const bearing = Math.atan2(
              latLng.lng - station.longitude,
              latLng.lat - station.latitude
            );
            
            const newLat = station.latitude + (MAX_DISTANCE_KM / 111.32) * Math.cos(bearing);
            const newLng = station.longitude + (MAX_DISTANCE_KM / (111.32 * Math.cos(station.latitude * Math.PI / 180))) * Math.sin(bearing);
            
            limitedCell.push([newLat, newLng]);
          } else {
            limitedCell.push([latLng.lat, latLng.lng]);
          }
        }

        if (limitedCell.length > 0) {
          polygons.push({
            positions: limitedCell,
            station: station,
            color: station.aqi.color
          });
        }
      }

      setVoronoiPolygons(polygons);
    } catch (error) {
      console.error('Błąd Woronoja:', error);
      setVoronoiPolygons([]);
    }
  };

  useEffect(() => {
    if (enabled) {
      updateVoronoi();
    } else {
      setVoronoiPolygons([]);
    }
  }, [stations, enabled]);

  useMapEvents({
    moveend: () => {
      if (enabled) updateVoronoi();
    },
    zoomend: () => {
      if (enabled) updateVoronoi();
    }
  });

  if (!enabled) return null;

  return (
    <>
      {voronoiPolygons.map((poly, idx) => (
        <Polygon
          key={`voronoi-${idx}-${poly.station?.id || idx}`}
          positions={poly.positions}
          pathOptions={{
            fillColor: poly.color,
            fillOpacity: 0.2,
            color: poly.color,
            weight: 1,
            opacity: 0.3
          }}
          eventHandlers={{
            click: () => poly.station && onStationClick(poly.station)
          }}
        />
      ))}
    </>
  );
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Map({ posts }) {
  const [airData, setAirData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [userLocation, setUserLocation] = useState([52.4064, 16.9252]);
  const [mapReady, setMapReady] = useState(false);
  const [viewStations, setViewStations] = useState([]);

  useEffect(() => {
    if (!selectedStation) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedStation(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedStation]);

  const handleVisibleChange = (inView, count) => {
    setViewStations(inView);
    setVisibleCount(count);
  };

  const showStatsButton = visibleCount > 20;

  useEffect(() => {
    // Lokalizacja tylko, gdy zgoda została już wcześniej udzielona (bez pytania przy starcie).
    // W pozostałych przypadkach użytkownik używa przycisku lokalizacji.
    if ('geolocation' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state !== 'granted') return;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation([position.coords.latitude, position.coords.longitude]);
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

  // Dane (ok. 600 KB) pobieramy dopiero po wyrenderowaniu kafelków mapy,
  // żeby nie blokować pierwszego malowania mapy
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
        setStats(result.stats);
        console.log(`Załadowano ${result.data.length} stacji (cache: ${result.cached})`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      setLoading(false);
    }
  }

  const showVoronoi = visibleCount >= 2 && visibleCount <= 25;
  const showClusters = !showVoronoi;

  return (
    <>
      <MapContainer
        center={userLocation}
        zoom={11}
        className={styles.map}
        zoomControl={true}
        scrollWheelZoom={true}
        preferCanvas={true}
        minZoom={6}
        maxZoom={19}
        maxBounds={POLAND_BOUNDS}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          eventHandlers={{ load: () => setMapReady(true) }}
        />

        {!loading && <MapInstructions />}
        <LocationButton />
        
        {/* Przycisk statystyk WEWNĄTRZ MapContainer */}
        {showStatsButton && (
          <div className={styles.statsButtonWrapper}>
            <Link
              href="/stats"
              className={styles.statsButton}
              title="Pokaż statystyki"
              aria-label="Pokaż statystyki"
            >
              <span aria-hidden="true">📊</span>
            </Link>
          </div>
        )}
        
        <VisibleMarkersTracker
          stations={airData}
          onVisibleChange={handleVisibleChange}
        />

        {showVoronoi && (
          <VoronoiLayer
            stations={viewStations}
            onStationClick={setSelectedStation}
            enabled={true}
          />
        )}

        {showClusters ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={80}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            iconCreateFunction={(cluster) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div class="${styles.clusterIcon}"><span>${count}</span></div>`,
                className: styles.clusterMarker,
                iconSize: L.point(40, 40)
              });
            }}
          >
            {viewStations.map((station) => (
              <CircleMarker
                key={`marker-${station.id}`}
                center={[station.latitude, station.longitude]}
                radius={8}
                pathOptions={{
                  fillColor: station.aqi.color,
                  fillOpacity: 1,
                  color: '#fff',
                  weight: 3
                }}
                eventHandlers={{
                  click: () => setSelectedStation(station)
                }}
              >
                <Popup>
                  <div className={styles.popup}>
                    <h3>{station.name}</h3>
                    <div className={styles.badge} style={{ backgroundColor: station.aqi.color, color: getReadableTextColor(station.aqi.color) }}>
                      {station.aqi.label}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MarkerClusterGroup>
        ) : (
          viewStations.map((station) => (
            <CircleMarker
              key={`marker-${station.id}`}
              center={[station.latitude, station.longitude]}
              radius={8}
              pathOptions={{
                fillColor: station.aqi.color,
                fillOpacity: 1,
                color: '#fff',
                weight: 3
              }}
              eventHandlers={{
                click: () => setSelectedStation(station)
              }}
            >
              <Popup>
                <div className={styles.popup}>
                  <h3>{station.name}</h3>
                  <div className={styles.badge} style={{ backgroundColor: station.aqi.color, color: getReadableTextColor(station.aqi.color) }}>
                    {station.aqi.label}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))
        )}
      </MapContainer>

      {loading && (
        <div className={styles.dataLoading} role="status">
          Ładowanie danych o jakości powietrza…
        </div>
      )}

      <BlogFloatingCards posts={posts} />

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

            <div className={styles.location}>
              <p><strong>📍 Lokalizacja:</strong></p>
              <p>{selectedStation.city}</p>
              {selectedStation.street && <p>{selectedStation.street}</p>}
            </div>

            <div className={styles.timestamp}>
              ⏱️ Aktualizacja: {new Date(selectedStation.timestamp).toLocaleString('pl-PL')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
