import '../styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { PaletteContext, loadPalette, savePalette } from '../lib/palette'
import { setActivePalette } from '../lib/aqiLevels'

export default function MyApp({ Component, pageProps }) {
  // Paleta kolorów (daltonizm): pierwszy render jak na serwerze, zapamiętany wybór wczytujemy po zamontowaniu.
  // Stan jest tutaj, żeby zmiana odświeżyła całą stronę, także komponenty bez kontekstu.
  const [palette, setPaletteState] = useState('default');
  setActivePalette(palette);

  useEffect(() => {
    setPaletteState(loadPalette());
  }, []);

  const setPalette = (next) => {
    setPaletteState(next);
    savePalette(next);
  };

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
      <PaletteContext.Provider value={{ palette, setPalette }}>
        <Component {...pageProps} />
      </PaletteContext.Provider>
    </>
  )
}
