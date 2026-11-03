import { usePalette } from '../lib/palette';
import styles from '../styles/PaletteToggle.module.css';

// Przełącznik palety kolorów dla osób z daltonizmem. variant="map": przycisk w kolumnie kontrolek mapy,
// variant="text": przycisk tekstowy (stopka).
export default function PaletteToggle({ variant = 'text' }) {
  const { palette, setPalette } = usePalette();
  const on = palette === 'cvd';
  const toggle = () => setPalette(on ? 'default' : 'cvd');

  if (variant === 'map') {
    const label = on ? 'Kolory dla daltonistów: włączone. Wyłącz' : 'Kolory dla daltonistów: wyłączone. Włącz';
    return (
      <button type="button" className={styles.mapButton} onClick={toggle} aria-pressed={on} title={label} aria-label={label}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" fill={on ? 'currentColor' : 'none'} />
        </svg>
      </button>
    );
  }

  return (
    <button type="button" className={styles.textButton} onClick={toggle} aria-pressed={on}>
      Kolory dla daltonistów: {on ? 'włączone' : 'wyłączone'}
    </button>
  );
}
