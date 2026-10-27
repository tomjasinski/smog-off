import { getReadableTextColor } from '../lib/aqiLevels';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AQI_LEVELS, calculateAQI } from '../lib/aqiLevels';
import styles from '../styles/StatsPage.module.css';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/air-quality');
      const result = await response.json();
      
      if (result.stats) {
        setStats(result.stats);
        setStations(result.data || []);
        setUpdatedAt(result.data?.[0]?.timestamp || null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <p>Nie udało się załadować statystyk</p>
      </div>
    );
  }

  const RANKING_SIZE = 10;
  const ranked = stations
    // Odczyty poniżej 1 µg/m³ (PM2.5 lub PM10) traktujemy jako podejrzane i pomijamy w rankingu
    .filter(s => s.data.pm25 >= 1 && s.data.pm10 >= 1)
    .sort((a, b) => a.data.pm25 - b.data.pm25 || a.data.pm10 - b.data.pm10);
  const cleanest = ranked.slice(0, RANKING_SIZE);
  const dirtiest = ranked.slice(-RANKING_SIZE).reverse();

  // Ranking miast: mediana jest odporna na pojedyncze błędne czujniki, a małe miejscowości pomijamy
  const MIN_STATIONS_PER_CITY = 3;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const round1 = (v) => Math.round(v * 10) / 10;
  const cityGroups = ranked.reduce((acc, s) => {
    const city = s.city.trim();
    if (!city) return acc;
    (acc[city] = acc[city] || []).push(s);
    return acc;
  }, {});
  const cities = Object.entries(cityGroups)
    .filter(([, list]) => list.length >= MIN_STATIONS_PER_CITY)
    .map(([city, list]) => {
      const pm25 = round1(median(list.map(s => s.data.pm25)));
      const pm10 = round1(median(list.map(s => s.data.pm10)));
      return { city, count: list.length, pm25, pm10, aqi: calculateAQI(pm25, pm10) };
    })
    .sort((a, b) => a.pm25 - b.pm25 || a.pm10 - b.pm10);
  const cleanestCities = cities.slice(0, RANKING_SIZE);
  const dirtiestCities = cities.slice(-RANKING_SIZE).reverse();

  const renderCityRanking = (title, list, id) => (
    <section className={styles.rankingColumn} aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <ol className={styles.rankingList}>
        {list.map(c => (
          <li key={c.city} className={styles.rankingItem}>
            <span className={styles.rankingDot} style={{ backgroundColor: c.aqi.color }} aria-hidden="true"></span>
            <span className={styles.rankingName}>
              <strong>{c.city}</strong>
              <span className={styles.rankingCity}>stacji: {c.count}</span>
            </span>
            <span className={styles.rankingValues}>
              <span>PM2.5: <strong>{c.pm25}</strong></span>
              <span>PM10: <strong>{c.pm10}</strong></span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );

  const renderRanking = (title, list, id) => (
    <section className={styles.rankingColumn} aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <ol className={styles.rankingList}>
        {list.map(s => (
          <li key={s.id} className={styles.rankingItem}>
            <span className={styles.rankingDot} style={{ backgroundColor: s.aqi.color }} aria-hidden="true"></span>
            <span className={styles.rankingName}>
              <strong>{s.name}</strong>
              {s.city && <span className={styles.rankingCity}>{s.city}</span>}
            </span>
            <span className={styles.rankingValues}>
              <span>PM2.5: <strong>{s.data.pm25}</strong></span>
              <span>PM10: <strong>{s.data.pm10}</strong></span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );

  return (
    <>
      <Head>
        <title>Statystyki jakości powietrza - SmogOFF</title>
        <meta name="description" content="Zbiorcze statystyki jakości powietrza w Polsce: średnie stężenia PM2.5 i PM10 oraz liczba stacji w poszczególnych kategoriach." />
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Powrót do mapy
        </Link>

        <article className={styles.article}>
          <h1>📊 Statystyki dla Polski</h1>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Stacji pomiarowych</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Średnie PM2.5</span>
              <span className={styles.statValue}>{stats.avgPM25} µg/m³</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Średnie PM10</span>
              <span className={styles.statValue}>{stats.avgPM10} µg/m³</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Temperatura</span>
              <span className={styles.statValue}>{stats.avgTemperature}°C</span>
            </div>
          </div>
          
          <div className={styles.aqiDistribution}>
            <h2>Jakość powietrza w Polsce</h2>
            <div className={styles.aqiBar}>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${(stats.good / stats.total * 100)}%`, 
                  backgroundColor: '#4ade80',

                  color: getReadableTextColor('#4ade80')
                }}
                title={`Dobra: ${stats.good}`}
              >
                {stats.good > 0 && <span>{stats.good}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${(stats.moderate / stats.total * 100)}%`, 
                  backgroundColor: '#fbbf24',

                  color: getReadableTextColor('#fbbf24')
                }}
                title={`Średnia: ${stats.moderate}`}
              >
                {stats.moderate > 0 && <span>{stats.moderate}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${(stats.unhealthy / stats.total * 100)}%`, 
                  backgroundColor: '#fb923c',

                  color: getReadableTextColor('#fb923c')
                }}
                title={`Niezdrowa: ${stats.unhealthy}`}
              >
                {stats.unhealthy > 0 && <span>{stats.unhealthy}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${((stats.veryUnhealthy || 0) / stats.total * 100)}%`, 
                  backgroundColor: '#ef4444',

                  color: getReadableTextColor('#ef4444')
                }}
                title={`Bardzo zła: ${stats.veryUnhealthy || 0}`}
              >
                {(stats.veryUnhealthy || 0) > 0 && <span>{stats.veryUnhealthy}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${((stats.hazardous || 0) / stats.total * 100)}%`, 
                  backgroundColor: '#a855f7',

                  color: getReadableTextColor('#a855f7')
                }}
                title={`Niebezpieczna: ${stats.hazardous || 0}`}
              >
                {(stats.hazardous || 0) > 0 && <span>{stats.hazardous}</span>}
              </div>
            </div>
            
            <div className={styles.statsLegend}>
              <div className={styles.legendRow}>
                <span className={styles.legendDot} style={{backgroundColor: '#4ade80'}}></span>
                <span>Dobra: {stats.good} ({((stats.good / stats.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className={styles.legendRow}>
                <span className={styles.legendDot} style={{backgroundColor: '#fbbf24'}}></span>
                <span>Średnia: {stats.moderate} ({((stats.moderate / stats.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className={styles.legendRow}>
                <span className={styles.legendDot} style={{backgroundColor: '#fb923c'}}></span>
                <span>Niezdrowa: {stats.unhealthy} ({((stats.unhealthy / stats.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className={styles.legendRow}>
                <span className={styles.legendDot} style={{backgroundColor: '#ef4444'}}></span>
                <span>Bardzo zła: {stats.veryUnhealthy || 0} ({(((stats.veryUnhealthy || 0) / stats.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className={styles.legendRow}>
                <span className={styles.legendDot} style={{backgroundColor: '#a855f7'}}></span>
                <span>Niebezpieczna: {stats.hazardous || 0} ({(((stats.hazardous || 0) / stats.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {ranked.length > 0 && (
            <div className={styles.rankingSection}>
              <h2>Ranking punktów pomiarowych</h2>
              <p className={styles.rankingNote}>
                Najnowsze dane z sieci czujników (µg/m³), sortowane wg PM2.5. Pomijamy odczyty poniżej 1 µg/m³.
                {updatedAt && ` Pomiar z ${updatedAt.slice(0, 16)}.`}
              </p>
              <div className={styles.rankingGrid}>
                {renderRanking(`Top ${cleanest.length} najczystsze`, cleanest, 'ranking-best')}
                {renderRanking(`Top ${dirtiest.length} najbardziej zanieczyszczone`, dirtiest, 'ranking-worst')}
              </div>
            </div>
          )}

          {cities.length > 0 && (
            <div className={styles.rankingSection}>
              <h2>Ranking miast</h2>
              <p className={styles.rankingNote}>
                Mediana odczytów ze wszystkich stacji w mieście (µg/m³), sortowana wg PM2.5.
                Uwzględniamy miasta z co najmniej {MIN_STATIONS_PER_CITY} stacjami ({cities.length} miast).
                Mediana jest odporna na pojedyncze błędne czujniki.
              </p>
              <div className={styles.rankingGrid}>
                {renderCityRanking(`Top ${cleanestCities.length} najczystsze miasta`, cleanestCities, 'ranking-cities-best')}
                {renderCityRanking(`Top ${dirtiestCities.length} najbardziej zanieczyszczone miasta`, dirtiestCities, 'ranking-cities-worst')}
              </div>
            </div>
          )}

          <div className={styles.aqiLevelsSection}>
            <h2>Normy PM2.5 (µg/m³)</h2>
            <div className={styles.levelsTable}>
              {AQI_LEVELS.pm25.slice(0, -1).map((level, idx) => {
                const prevMax = idx > 0 ? AQI_LEVELS.pm25[idx - 1].max + 0.1 : 0;
                return (
                  <div key={level.level} className={styles.levelRow}>
                    <span className={styles.levelDot} style={{ backgroundColor: level.color }}></span>
                    <span className={styles.levelLabel}>{level.label}</span>
                    <span className={styles.levelRange}>
                      {prevMax.toFixed(1)} - {level.max.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            <h2 style={{ marginTop: '2rem' }}>Normy PM10 (µg/m³)</h2>
            <div className={styles.levelsTable}>
              {AQI_LEVELS.pm10.slice(0, -1).map((level, idx) => {
                const prevMax = idx > 0 ? AQI_LEVELS.pm10[idx - 1].max + 1 : 0;
                return (
                  <div key={level.level} className={styles.levelRow}>
                    <span className={styles.levelDot} style={{ backgroundColor: level.color }}></span>
                    <span className={styles.levelLabel}>{level.label}</span>
                    <span className={styles.levelRange}>
                      {prevMax.toFixed(0)} - {level.max.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
