import { getReadableTextColor, paletteColor } from '../lib/aqiLevels';
import styles from '../styles/LevelBadge.module.css';
import { useT } from '../lib/i18n';

// Poziom jakości powietrza jako kolorowa etykieta (tekst zawsze czytelny na tle koloru poziomu)
export default function LevelBadge({ color, label, small = false }) {
  const { t } = useT();
  return (
    <span
      className={`${styles.badge} ${small ? styles.small : ''}`}
      style={{ backgroundColor: paletteColor(color), color: getReadableTextColor(color) }}
    >
      {t(label)}
    </span>
  );
}
