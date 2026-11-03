import Link from 'next/link';
import { useSettings } from '../lib/settingsContext';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  const { openSettings } = useSettings();

  return (
    <footer className={styles.footer}>
      <p>
        <Link href="/stacje">Lista stacji</Link>
        {' · '}
        <Link href="/stats">Statystyki</Link>
        {' · '}
        <Link href="/miasta">Miasta</Link>
      </p>
      <p>
        <button type="button" className={styles.settingsButton} onClick={openSettings}>Ustawienia</button>
      </p>
      <p>© {new Date().getFullYear()} Tomasz Jasiński</p>
      <p className={styles.subtext}>
        Dane z <a href="https://ose.gov.pl" target="_blank" rel="noopener noreferrer">ESA Poland<span className="sr-only"> (otwiera się w nowej karcie)</span></a>
      </p>
    </footer>
  );
}