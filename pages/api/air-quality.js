import NodeCache from 'node-cache';
import axios from 'axios';
import { mapStation, summarizeStations } from '../../lib/airQuality';

const cache = new NodeCache({ stdTTL: 3600 });
const API_URL = 'https://public-esa.ose.gov.pl/api/v1/smog';
const POZNAN_COORDS = { lat: 52.4064, lng: 16.9252, radius: 550 };

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default async function handler(req, res) {
  try {
    let allStations = cache.get('airQualityStations');
    const cached = Boolean(allStations);

    if (!allStations) {
      console.log('Pobieram świeże dane z API...');
      const response = await axios.get(API_URL);

      if (!response.data || !response.data.smog_data) {
        throw new Error('Nieprawidłowa struktura danych API');
      }

      allStations = response.data.smog_data
        .filter(item => {
          if (!item.school?.latitude || !item.school?.longitude) return false;

          const distance = calculateDistance(
            POZNAN_COORDS.lat,
            POZNAN_COORDS.lng,
            parseFloat(item.school.latitude),
            parseFloat(item.school.longitude)
          );

          return distance < POZNAN_COORDS.radius;
        })
        .map(mapStation);

      cache.set('airQualityStations', allStations);
      console.log(`Znaleziono ${allStations.length} stacji w Polsce`);
    }

    // Świeżość liczymy przy każdym żądaniu, więc dane z cache też się "starzeją"
    const { stations, stats } = summarizeStations(allStations);

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
