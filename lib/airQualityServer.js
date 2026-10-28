import NodeCache from 'node-cache';
import axios from 'axios';
import { mapStation, summarizeStations } from './airQuality';

const cache = new NodeCache({ stdTTL: 3600 });
const API_URL = 'https://public-esa.ose.gov.pl/api/v1/smog';
const POZNAN_COORDS = { lat: 52.4064, lng: 16.9252, radius: 550 };

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Pobiera wszystkie stacje (z cache na godzinę). Używane przez API i przez strony generowane na serwerze.
export async function getAllStations() {
  let allStations = cache.get('airQualityStations');
  const cached = Boolean(allStations);

  if (!allStations) {
    console.log('Pobieram świeże dane z API...');
    const response = await axios.get(API_URL);

    if (!response.data || !response.data.smog_data) {
      throw new Error('Nieprawidłowa struktura danych API');
    }

    allStations = response.data.smog_data
      .filter((item) => {
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

  return { allStations, cached };
}

// Tylko świeże stacje (bez pomiarów starszych niż limit) wraz ze statystykami
export async function getFreshStations() {
  const { allStations, cached } = await getAllStations();
  return { ...summarizeStations(allStations), cached };
}
