import NodeCache from 'node-cache';
import axios from 'axios';
import { mapStation, summarizeStations } from './airQuality';

// Dane ze źródła odświeżamy najwyżej raz na 10 minut (czujniki raportują średnie z ok. godziny, więc częściej nie ma sensu).
// Wszyscy użytkownicy dzielą jedno pobranie; zmienisz to zmienną AIR_CACHE_TTL_SECONDS.
const CACHE_TTL_SECONDS = Number(process.env.AIR_CACHE_TTL_SECONDS) || 600;
const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS });
// Ostatnie poprawnie pobrane dane: używane, gdy źródło chwilowo nie odpowiada
let lastGood = null;
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

// Pobiera wszystkie stacje (z cache na kilka minut). Używane przez API i przez strony generowane na serwerze.
export async function getAllStations() {
  let allStations = cache.get('airQualityStations');
  const cached = Boolean(allStations);

  if (!allStations) {
    try {
      allStations = await fetchStations();
      lastGood = allStations;
      cache.set('airQualityStations', allStations);
    } catch (error) {
      if (!lastGood) throw error;
      console.error('Źródło danych niedostępne, używam ostatnich danych:', error.message);
      return { allStations: lastGood, cached: true };
    }
  }

  return { allStations, cached };
}

async function fetchStations() {
  console.log('Pobieram świeże dane z API...');
  const response = await axios.get(API_URL, { timeout: 15000 });

  if (!response.data || !response.data.smog_data) {
    throw new Error('Nieprawidłowa struktura danych API');
  }

  const stations = response.data.smog_data
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

  console.log(`Znaleziono ${stations.length} stacji w Polsce`);
  return stations;
}

// Tylko świeże stacje (bez pomiarów starszych niż limit) wraz ze statystykami
export async function getFreshStations() {
  const { allStations, cached } = await getAllStations();
  return { ...summarizeStations(allStations), cached };
}
