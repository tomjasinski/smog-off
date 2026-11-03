import { useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../lib/settingsContext';
import { groupCities } from '../lib/cities';
import styles from '../styles/Settings.module.css';

function RadioGroup({ legend, name, value, options, onChange, hint }) {
  return (
    <fieldset className={styles.group}>
      <legend>{legend}</legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const centroid = (stations) => ({
  lat: stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length,
  lng: stations.reduce((sum, s) => sum + s.longitude, 0) / stations.length
});

// Okno ustawień. mapContext (tylko na mapie): { stations, favorites, getView, onClearData } odblokowuje wybór miejsca startu.
export default function SettingsDialog({ onClose, mapContext }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // Fokus krąży wewnątrz okna
      const focusable = [...dialogRef.current.querySelectorAll('button, input, select, a[href]')].filter((el) => !el.disabled);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [onClose]);

  const cities = useMemo(
    () =>
      mapContext
        ? groupCities(mapContext.stations).map((city) => ({ name: city.name, slug: city.slug, ...centroid(city.stations) }))
        : [],
    [mapContext]
  );
  const favoriteStations = mapContext
    ? mapContext.favorites
        .map((f) => mapContext.stations.find((s) => String(s.id) === f.id))
        .filter(Boolean)
    : [];

  const set = (key) => (value) => updateSettings({ [key]: value });
  const { start } = settings;

  const chooseStartMode = (mode) => {
    if (mode === 'last' || mode === 'default') {
      updateSettings({ start: { mode } });
    } else if (mode === 'city' && cities[0]) {
      const c = cities[0];
      updateSettings({ start: { mode, lat: c.lat, lng: c.lng, zoom: 12, label: c.name } });
    } else if (mode === 'station' && favoriteStations[0]) {
      const s = favoriteStations[0];
      updateSettings({ start: { mode, id: String(s.id), lat: s.latitude, lng: s.longitude, zoom: 14, label: s.name } });
    } else if (mode === 'fixed') {
      const view = mapContext.getView();
      if (view) updateSettings({ start: { mode, ...view, label: 'wybrany widok' } });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" ref={closeRef} className={styles.close} onClick={onClose} aria-label="Zamknij ustawienia">
          <span aria-hidden="true">×</span>
        </button>
        <h2 id="settings-title">Ustawienia</h2>
        <p className={styles.hint}>Zapisywane tylko w tej przeglądarce.</p>

        <RadioGroup
          legend="Motyw"
          name="theme"
          value={settings.theme}
          onChange={set('theme')}
          options={[
            { value: 'system', label: 'Jak w systemie' },
            { value: 'light', label: 'Jasny' },
            { value: 'dark', label: 'Ciemny' }
          ]}
        />

        <RadioGroup
          legend="Kolory poziomów jakości powietrza"
          name="palette"
          value={settings.palette}
          onChange={set('palette')}
          hint="Wersja dla daltonistów używa niebieskiego, żółtego i pomarańczowego zamiast zieleni i czerwieni."
          options={[
            { value: 'default', label: 'Standardowe (zieleń–czerwień)' },
            { value: 'cvd', label: 'Dla daltonistów' }
          ]}
        />

        <RadioGroup
          legend="Kontrast"
          name="contrast"
          value={settings.contrast}
          onChange={set('contrast')}
          options={[
            { value: 'normal', label: 'Standardowy' },
            { value: 'high', label: 'Wysoki' }
          ]}
        />

        <RadioGroup
          legend="Rozmiar tekstu"
          name="textSize"
          value={settings.textSize}
          onChange={set('textSize')}
          options={[
            { value: 'normal', label: 'Standardowy' },
            { value: 'large', label: 'Większy' }
          ]}
        />

        <RadioGroup
          legend="Cele dotykowe (przyciski i punkty na mapie)"
          name="touch"
          value={settings.touch}
          onChange={set('touch')}
          options={[
            { value: 'normal', label: 'Standardowe' },
            { value: 'large', label: 'Duże' }
          ]}
        />

        <RadioGroup
          legend="Animacje"
          name="motion"
          value={settings.motion}
          onChange={set('motion')}
          options={[
            { value: 'auto', label: 'Jak w systemie' },
            { value: 'reduce', label: 'Ogranicz' }
          ]}
        />

        {mapContext && (
          <>
            <fieldset className={styles.group}>
              <legend>Mapa</legend>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={settings.zones}
                  onChange={(e) => updateSettings({ zones: e.target.checked })}
                />
                <span>Pokazuj zasięg oddziaływania stacji (rozmyte pola wokół punktów)</span>
              </label>
            </fieldset>

            <RadioGroup
              legend="Gdzie otwiera się mapa"
              name="start"
              value={start.mode}
              onChange={chooseStartMode}
              options={[
                { value: 'last', label: 'Tam, gdzie ostatnio skończyłem' },
                { value: 'default', label: 'Domyślnie (Poznań lub moja lokalizacja)' },
                { value: 'city', label: 'W wybranym mieście', disabled: cities.length === 0 },
                { value: 'station', label: 'Przy ulubionej stacji', disabled: favoriteStations.length === 0 },
                { value: 'fixed', label: 'W widoku, który teraz widzę' }
              ]}
            />

            {start.mode === 'city' && (
              <div className={styles.field}>
                <label htmlFor="start-city">Miasto</label>
                <select
                  id="start-city"
                  value={start.label}
                  onChange={(e) => {
                    const c = cities.find((city) => city.name === e.target.value);
                    if (c) updateSettings({ start: { mode: 'city', lat: c.lat, lng: c.lng, zoom: 12, label: c.name } });
                  }}
                >
                  {!cities.some((c) => c.name === start.label) && <option value={start.label}>{start.label}</option>}
                  {cities.map((c) => (
                    <option key={c.slug} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {start.mode === 'station' && (
              <div className={styles.field}>
                <label htmlFor="start-station">Stacja</label>
                <select
                  id="start-station"
                  value={start.id}
                  onChange={(e) => {
                    const s = favoriteStations.find((st) => String(st.id) === e.target.value);
                    if (s) {
                      updateSettings({ start: { mode: 'station', id: String(s.id), lat: s.latitude, lng: s.longitude, zoom: 14, label: s.name } });
                    }
                  }}
                >
                  {!favoriteStations.some((s) => String(s.id) === start.id) && <option value={start.id}>{start.label}</option>}
                  {favoriteStations.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {start.mode === 'fixed' && (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  const view = mapContext.getView();
                  if (view) updateSettings({ start: { mode: 'fixed', ...view, label: 'wybrany widok' } });
                }}
              >
                Użyj bieżącego widoku mapy
              </button>
            )}
          </>
        )}

        <div className={styles.footerActions}>
          <button type="button" className={styles.secondary} onClick={resetSettings}>
            Przywróć ustawienia domyślne
          </button>
          {mapContext && (
            <button type="button" className={styles.secondary} onClick={mapContext.onClearData}>
              Usuń ulubione i zapamiętany widok
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
