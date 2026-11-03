import { getReadableTextColor } from '../lib/aqiLevels';
import styles from '../styles/LevelBadge.module.css';

// Poziom jakości powietrza jako kolorowa etykieta (tekst zawsze czytelny na tle koloru poziomu)
export default function LevelBadge({ color, label, small = false }) {
  return (
    <span
      className={`${styles.badge} ${small ? styles.small : ''}`}
      style={{ backgroundColor: color, color: getReadableTextColor(color) }}
    >
      {label}
    </span>
  );
}
