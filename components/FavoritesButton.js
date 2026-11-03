import { useEffect, useRef, useState } from 'react';
import LevelBadge from './LevelBadge';
import { MAX_FAVORITES } from '../lib/preferences';
import styles from '../styles/Favorites.module.css';
import { useT } from '../lib/i18n';

// Przycisk gwiazdki na mapie: lista ulubionych stacji (do 3) z aktualnym poziomem jakości powietrza.
// Kliknięcie stacji przybliża do niej mapę i otwiera szczegóły.
export default function FavoritesButton({ favorites, stations, onSelect, onRemove }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const byId = new Map(stations.map((s) => [String(s.id), s]));

  return (
    <div ref={rootRef}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="favorites-panel"
        title={t('Ulubione stacje')}
        aria-label={t('Ulubione stacje ({count} z {max})', { count: favorites.length, max: MAX_FAVORITES })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.length ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      </button>

      {open && (
        <div id="favorites-panel" className={styles.panel}>
          <h2 className={styles.title}>{t('Ulubione stacje')}</h2>
          {favorites.length === 0 ? (
            <p className={styles.empty}>
              {t('Otwórz szczegóły stacji i wybierz „Dodaj do ulubionych”. Możesz zapisać do {max} stacji.', { max: MAX_FAVORITES })}
            </p>
          ) : (
            <ul className={styles.list}>
              {favorites.map((fav) => {
                const station = byId.get(fav.id);
                return (
                  <li key={fav.id} className={styles.item}>
                    <button
                      type="button"
                      className={styles.stationButton}
                      onClick={() => {
                        if (!station) return;
                        setOpen(false);
                        onSelect(station);
                      }}
                      disabled={!station}
                    >
                      <span className={styles.name}>{station?.name || fav.name || t('Stacja')}</span>
                      {station ? (
                        <LevelBadge color={station.aqi.color} label={station.aqi.label} small />
                      ) : (
                        <span className={styles.missing}>{t('brak świeżych danych')}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => onRemove(fav.id)}
                      aria-label={t('Usuń z ulubionych: {name}', { name: station?.name || fav.name || t('stacja') })}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
