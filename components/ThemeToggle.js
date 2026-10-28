import styles from '../styles/Map.module.css';

// Przycisk zmiany motywu (jasny/ciemny), stoi pod przyciskiem lokalizacji.
// Ikona pokazuje bieżący tryb: słońce = jasny, księżyc = ciemny.
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  const label = `Motyw: ${isDark ? 'ciemny' : 'jasny'}. Przełącz na ${isDark ? 'jasny' : 'ciemny'}`;

  return (
    <button type="button" className={styles.themeButton} onClick={onToggle} title={label} aria-label={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isDark ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
