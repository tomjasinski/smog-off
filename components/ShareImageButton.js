import { useEffect, useRef, useState } from 'react';
import { slugify } from '../lib/shareImage';
import styles from '../styles/ShareImageButton.module.css';

// render: () => Promise<Blob> (PNG). Podgląd w oknie, a pod nim pobranie i (gdy się da) udostępnienie pliku.
export default function ShareImageButton({ label = 'Udostępnij jako grafikę', title, text, render }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [canShare, setCanShare] = useState(false);
  const openerRef = useRef(null);
  const closeRef = useRef(null);

  const fileName = `${slugify(title)}.png`;

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await render();
      const file = new File([blob], fileName, { type: 'image/png' });
      setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
      setPreview({ url: URL.createObjectURL(blob), file });
    } catch (err) {
      console.error('Błąd tworzenia grafiki:', err);
      setError('Nie udało się utworzyć grafiki.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    openerRef.current?.focus();
  };

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [preview]);

  const share = async () => {
    try {
      await navigator.share({ files: [preview.file], title, text });
    } catch (err) {
      // AbortError = użytkownik zamknął okno udostępniania
      if (err?.name !== 'AbortError') setError('Nie udało się udostępnić grafiki.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.button} onClick={open} disabled={busy} ref={openerRef}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {busy ? 'Tworzę grafikę…' : label}
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}

      {preview && (
        <div className={styles.overlay} onClick={close}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-image-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="share-image-title">{title}</h2>
            <div className={styles.previewBox}>
              <img src={preview.url} alt={`Podgląd grafiki: ${title}`} className={styles.preview} />
            </div>
            <div className={styles.actions}>
              <a className={styles.primary} href={preview.url} download={fileName}>Pobierz PNG</a>
              {canShare && (
                <button type="button" className={styles.secondary} onClick={share}>Udostępnij</button>
              )}
              <button type="button" className={styles.secondary} onClick={close} ref={closeRef}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
