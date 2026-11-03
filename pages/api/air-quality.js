import { createHash } from 'node:crypto';
import { getFreshStations } from '../../lib/airQualityServer';

export default async function handler(req, res) {
  try {
    // Świeżość liczymy przy każdym żądaniu, więc dane z cache też się "starzeją"
    const { stations, stats, cached } = await getFreshStations();
    const payload = { data: stations, stats };

    // ETag z samych danych: gdy się nie zmieniły, przeglądarka dostaje 304 bez 600 KB treści
    const etag = `"${createHash('sha1').update(JSON.stringify(payload)).digest('base64url')}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=300');
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    // res.end zamiast res.json: Next przy json() nadpisałby ETag własnym, liczonym także ze znacznika czasu
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).end(JSON.stringify({ ...payload, cached, timestamp: new Date().toISOString() }));
  } catch (error) {
    console.error('Błąd pobierania danych:', error.message);
    res.status(500).json({
      error: 'Błąd pobierania danych',
      message: error.message
    });
  }
}
