import { useState } from 'react';
import styles from '../styles/ShareStationButton.module.css';
import { useT, localePrefix } from '../lib/i18n';

export default function ShareStationButton({ station }) {
  const { t, locale } = useT();
  const [status, setStatus] = useState('');

  const share = async () => {
    const { pm25, pm10 } = station.data;
    const payload = {
      title: `SmogOFF – ${station.name}`,
      text: `${station.name}, ${station.city}: PM2.5 ${pm25.toFixed(1)} µg/m³, PM10 ${pm10.toFixed(1)} µg/m³ (${t(station.aqi.label)})`,
      url: `${window.location.origin}${localePrefix(locale)}/stacja/${encodeURIComponent(station.id)}`
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
      setStatus(t('Skopiowano do schowka'));
      setTimeout(() => setStatus(''), 2500);
    } catch (err) {
      // AbortError = użytkownik zamknął okno udostępniania
      if (err?.name !== 'AbortError') {
        setStatus(t('Nie udało się udostępnić'));
        setTimeout(() => setStatus(''), 2500);
      }
    }
  };

  return (
    <div className={styles.wrapper}>
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
      <span className={styles.status} role="status">{status}</span>
    </div>
  );
}
