import { getReadableTextColor } from '../lib/aqiLevels';
import { AQI_LEVELS } from '../lib/aqiLevels';
import styles from '../styles/StatsOverlay.module.css';

export default function StatsOverlay({ stats, visible, onClose }) {
  if (!visible || !stats) return null;

  return (
    <div className={styles.statsOverlay}>
      <div className={styles.statsCard}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <h3>📊 Statystyki dla Polski</h3>
        
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Stacji pomiarowych</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Średnie PM2.5</span>
            <span className={styles.statValue}>{stats.avgPM25} µg/m³</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Średnie PM10</span>
            <span className={styles.statValue}>{stats.avgPM10} µg/m³</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Temperatura</span>
            <span className={styles.statValue}>{stats.avgTemperature}°C</span>
          </div>
        </div>
        
        <div className={styles.aqiDistribution}>
          <h4>Jakość powietrza</h4>
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
              {stats.good > 0 && stats.good}
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
              {stats.moderate > 0 && stats.moderate}
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
              {stats.unhealthy > 0 && stats.unhealthy}
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
              {(stats.veryUnhealthy || 0) > 0 && stats.veryUnhealthy}
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
              {(stats.hazardous || 0) > 0 && stats.hazardous}
            </div>
          </div>
        </div>

        <div className={styles.aqiLegend}>
          <h4>Normy PM2.5 (µg/m³)</h4>
          <div className={styles.legendList}>
            {AQI_LEVELS.pm25.slice(0, -1).map((level, idx) => {
              const prevMax = idx > 0 ? AQI_LEVELS.pm25[idx - 1].max + 0.1 : 0;
              return (
                <div key={level.level} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: level.color }}></span>
                  <span className={styles.legendLabel}>{level.label}</span>
                  <span className={styles.legendRange}>
                    {prevMax.toFixed(1)} - {level.max.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          <h4 style={{ marginTop: '1rem' }}>Normy PM10 (µg/m³)</h4>
          <div className={styles.legendList}>
            {AQI_LEVELS.pm10.slice(0, -1).map((level, idx) => {
              const prevMax = idx > 0 ? AQI_LEVELS.pm10[idx - 1].max + 1 : 0;
              return (
                <div key={level.level} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: level.color }}></span>
                  <span className={styles.legendLabel}>{level.label}</span>
                  <span className={styles.legendRange}>
                    {prevMax.toFixed(0)} - {level.max.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <p className={styles.hint}>💡 Przybliż mapę, aby zobaczyć szczegóły</p>
      </div>
    </div>
  );
}
