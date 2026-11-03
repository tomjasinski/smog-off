import '../styles/globals.css'
import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import SettingsDialog from '../components/SettingsDialog'
import LocaleMeta from '../components/LocaleMeta'
import { SettingsContext } from '../lib/settingsContext'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, clearSettings, applySettings } from '../lib/settings'
import { setActivePalette } from '../lib/aqiLevels'

export default function MyApp({ Component, pageProps }) {
  // Ustawienia użytkownika: pierwszy render jak na serwerze (domyślne), zapamiętane wczytujemy po zamontowaniu.
  // Stan jest tutaj, żeby zmiana odświeżyła całą stronę, także komponenty bez kontekstu (np. kolory poziomów).
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  setActivePalette(settings.palette);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      applySettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    clearSettings();
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="application-name" content="SmogOFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SmogOFF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1f2937" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
      </Head>
      <LocaleMeta />
      <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, openSettings }}>
        <Component {...pageProps} />
        {settingsOpen && <SettingsDialog onClose={closeSettings} />}
      </SettingsContext.Provider>
    </>
  )
}
