import { getReadableTextColor } from '../lib/aqiLevels';
import { AQI_LEVELS, AQI_LEVEL_LIST, describeRange } from '../lib/aqiLevels';
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
          <div className={styles.aqiBar} role="img" aria-label="Rozkład stacji według jakości powietrza">
            {AQI_LEVEL_LIST.map(({ level, color, label }) => {
              const count = stats.levels[level] || 0;
              return (
                <div
                  key={level}
                  className={styles.aqiSegment}
                  style={{
                    width: `${(count / stats.total * 100)}%`,
                    backgroundColor: color,
                    color: getReadableTextColor(color)
                  }}
                  title={`${label}: ${count}`}
                >
                  {count > 0 && count}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.aqiLegend}>
          <h4>Progi PM2.5 (µg/m³)</h4>
          <div className={styles.legendList}>
            {AQI_LEVELS.pm25.map((level, idx) => (
              <div key={level.level} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: level.color }}></span>
                <span className={styles.legendLabel}>{level.label}</span>
                <span className={styles.legendRange}>{describeRange('pm25', idx)}</span>
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: '1rem' }}>Progi PM10 (µg/m³)</h4>
          <div className={styles.legendList}>
            {AQI_LEVELS.pm10.map((level, idx) => (
              <div key={level.level} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: level.color }}></span>
                <span className={styles.legendLabel}>{level.label}</span>
                <span className={styles.legendRange}>{describeRange('pm10', idx)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.hint}>💡 Przybliż mapę, aby zobaczyć szczegóły</p>
      </div>
    </div>
  );
}
