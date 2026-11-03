import { useState } from 'react';
import { AQI_LEVEL_LIST, describeRange } from '../lib/aqiLevels';
import styles from '../styles/MapLegend.module.css';

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.legend} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="legend-details"
      >
        <span className={styles.title}>Jakość powietrza</span>
        <span className={styles.bar} aria-hidden="true">
          {AQI_LEVEL_LIST.map(({ level, color }) => (
            <span key={level} style={{ backgroundColor: color }} />
          ))}
        </span>
        <span className={styles.ends} aria-hidden="true">
          <span>{AQI_LEVEL_LIST[0].label}</span>
          <span>{AQI_LEVEL_LIST[AQI_LEVEL_LIST.length - 1].label}</span>
        </span>
      </button>

      {open && (
        <table id="legend-details" className={styles.details}>
          <caption>Stężenie pyłu, µg/m³ (EAQI)</caption>
          <thead>
            <tr>
              <th scope="col">Poziom</th>
              <th scope="col">PM2.5</th>
              <th scope="col">PM10</th>
            </tr>
          </thead>
          <tbody>
            {AQI_LEVEL_LIST.map(({ level, color, label }, i) => (
              <tr key={level}>
                <th scope="row">
                  <span className={styles.swatch} style={{ backgroundColor: color }} aria-hidden="true" />
                  {label}
                </th>
                <td>{describeRange('pm25', i)}</td>
                <td>{describeRange('pm10', i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {open && (
        <p className={styles.note}>
          Rozmyte pole wokół stacji to orientacyjny zasięg oddziaływania (ok. 1,5 km). Z dala od stacji dane są mniej pewne.
        </p>
      )}
    </div>
  );
}
