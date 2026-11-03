import { ImageResponse } from 'next/og';
import { getFreshStations } from '../../lib/airQualityServer';
import { buildOgData } from '../../lib/og';
import { AQI_LEVEL_LIST, getReadableTextColor } from '../../lib/aqiLevels';
import { SITE_HOST } from '../../lib/site';

// Obraz podglądu linku (Open Graph, 1200x630) z aktualnym poziomem jakości powietrza:
// /api/og (cała Polska), /api/og?city=<slug>, /api/og?station=<id>.
// Wynik trafia do cache CDN na 10 minut, więc komunikatory nie obciążają źródła danych.
const WIDTH = 1200;
const HEIGHT = 630;

const first = (value) => (Array.isArray(value) ? value[0] : value);

function Card({ data }) {
  const textColor = getReadableTextColor(data.aqi.color);
  const nameSize = data.title.length > 38 ? 54 : data.title.length > 24 ? 66 : 80;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px 48px',
        color: '#f9fafb',
        background: 'linear-gradient(180deg, #0b0e13 0%, #1f2937 100%)'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' }}>
        {AQI_LEVEL_LIST.map(({ level, color }) => (
          <div key={level} style={{ flex: 1, background: color }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#9ca3af' }}>
          {data.kind === 'country' ? 'SmogOFF' : 'Jakość powietrza'}
        </div>
        <div style={{ display: 'flex', fontSize: nameSize, fontWeight: 800, lineHeight: 1.1, marginTop: 12 }}>{data.title}</div>
        <div style={{ display: 'flex', fontSize: 32, color: '#9ca3af', marginTop: 10 }}>{data.subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div
          style={{
            display: 'flex',
            padding: '14px 36px',
            borderRadius: 999,
            fontSize: 52,
            fontWeight: 800,
            background: data.aqi.color,
            color: textColor
          }}
        >
          {data.aqi.label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#9ca3af' }}>PM2.5 · PM10 (µg/m³)</div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800 }}>
            {data.pm25} · {data.pm10}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#d1d5db' }}>{SITE_HOST}</div>
    </div>
  );
}

export default async function handler(req, res) {
  try {
    const { stations, stats } = await getFreshStations();
    const data = buildOgData({ city: first(req.query.city), station: first(req.query.station) }, stations, stats);
    if (!data) {
      res.status(404).end('Nie znaleziono');
      return;
    }

    const image = new ImageResponse(<Card data={data} />, { width: WIDTH, height: HEIGHT });
    const body = Buffer.from(await image.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600');
    res.status(200).end(body);
  } catch (error) {
    console.error('Błąd obrazu OG:', error.message);
    res.status(500).end('Błąd');
  }
}
