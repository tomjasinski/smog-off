import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AQI_LEVELS } from '../lib/aqiLevels';
import styles from '../styles/StatsPage.module.css';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
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

  return (
    <>
      <Head>
        <title>Statystyki jakości powietrza - SmogOFF</title>
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
                  backgroundColor: '#4ade80' 
                }}
                title={`Dobra: ${stats.good}`}
              >
                {stats.good > 0 && <span>{stats.good}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${(stats.moderate / stats.total * 100)}%`, 
                  backgroundColor: '#fbbf24' 
                }}
                title={`Średnia: ${stats.moderate}`}
              >
                {stats.moderate > 0 && <span>{stats.moderate}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${(stats.unhealthy / stats.total * 100)}%`, 
                  backgroundColor: '#fb923c' 
                }}
                title={`Niezdrowa: ${stats.unhealthy}`}
              >
                {stats.unhealthy > 0 && <span>{stats.unhealthy}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${((stats.veryUnhealthy || 0) / stats.total * 100)}%`, 
                  backgroundColor: '#ef4444' 
                }}
                title={`Bardzo zła: ${stats.veryUnhealthy || 0}`}
              >
                {(stats.veryUnhealthy || 0) > 0 && <span>{stats.veryUnhealthy}</span>}
              </div>
              <div 
                className={styles.aqiSegment} 
                style={{ 
                  width: `${((stats.hazardous || 0) / stats.total * 100)}%`, 
                  backgroundColor: '#a855f7' 
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
