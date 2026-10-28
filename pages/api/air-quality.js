import { getFreshStations } from '../../lib/airQualityServer';

export default async function handler(req, res) {
  try {
    // Świeżość liczymy przy każdym żądaniu, więc dane z cache też się "starzeją"
    const { stations, stats, cached } = await getFreshStations();

    res.status(200).json({
      data: stations,
      stats,
      cached,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Błąd pobierania danych:', error.message);
    res.status(500).json({
      error: 'Błąd pobierania danych',
      message: error.message
    });
  }
}
