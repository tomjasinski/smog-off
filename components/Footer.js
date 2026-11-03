import Link from 'next/link';
import { useSettings } from '../lib/settingsContext';
import styles from '../styles/Footer.module.css';
import { useT } from '../lib/i18n';
import LanguageSwitch from './LanguageSwitch';

export default function Footer() {
  const { t } = useT();
  const { openSettings } = useSettings();

  return (
    <footer className={styles.footer}>
      <p>
        <Link href="/stacje">{t('Lista stacji')}</Link>
        {' · '}
        <Link href="/stats">{t('Statystyki')}</Link>
        {' · '}
        <Link href="/miasta">{t('Miasta')}</Link>
      </p>
      <p>
        <LanguageSwitch />
      </p>
      <p>
        <button type="button" className={styles.settingsButton} onClick={openSettings}>{t('Ustawienia')}</button>
      </p>
      <p>© {new Date().getFullYear()} Tomasz Jasiński</p>
      <p className={styles.subtext}>
        {t('Dane z')} <a href="https://ose.gov.pl" target="_blank" rel="noopener noreferrer">ESA Poland<span className="sr-only"> {t('(otwiera się w nowej karcie)')}</span></a>
      </p>
    </footer>
  );
}