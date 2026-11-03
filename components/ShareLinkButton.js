import { useEffect, useState } from 'react';
import styles from '../styles/ShareLinkButton.module.css';
import { useT } from '../lib/i18n';

// Adresy rozgrzane w tej sesji (strona i obraz podglądu), żeby nie robić tego drugi raz dla tej samej stacji
const warmed = new Set();

// Udostępnienie linku (arkusz systemowy albo kopiowanie do schowka).
// warm: adresy (strona i obraz podglądu), które wołamy z wyprzedzeniem, żeby przy wklejeniu linku w komunikatorze
// były już wygenerowane i w cache (pierwsze żądanie generuje stronę i obraz, co potrafi trwać dłużej niż limit robota podglądów).
// onStatus: gdy podane, komunikat pokazuje rodzic (np. w jednej linii z innym przyciskiem).
export default function ShareLinkButton({ title, text, url, warm = [], onStatus }) {
  const { t } = useT();
  const [status, setStatus] = useState('');
  const warmKey = warm.join('|');

  useEffect(() => {
    if (!warmKey) return;
    const timer = setTimeout(() => {
      for (const target of warmKey.split('|')) {
        if (warmed.has(target)) continue;
        warmed.add(target);
        fetch(target, { priority: 'low' }).catch(() => warmed.delete(target));
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [warmKey]);

  const show = (message) => {
    if (onStatus) onStatus(message);
    else setStatus(message);
    if (message) {
      setTimeout(() => (onStatus ? onStatus('') : setStatus('')), 2500);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      show(t('Skopiowano do schowka'));
    } catch (err) {
      // AbortError = użytkownik zamknął okno udostępniania
      if (err?.name !== 'AbortError') show(t('Nie udało się udostępnić'));
    }
  };

  return (
    <div className={onStatus ? styles.bare : styles.wrapper}>
      <button type="button" className={styles.button} onClick={share}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {t('Udostępnij')}
      </button>
      {!onStatus && <span className={styles.status} role="status">{status}</span>}
    </div>
  );
}
