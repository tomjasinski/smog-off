import NodeCache from 'node-cache';
import axios from 'axios';
import { calculateAQI } from '../../lib/aqiLevels';

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
    const cachedData = cache.get('airQualityData');
    
    if (cachedData) {
      console.log('Zwracam dane z cache');
      return res.status(200).json({
        data: cachedData.data,
        stats: cachedData.stats,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('Pobieram świeże dane z API...');
    const response = await axios.get(API_URL);
    
    if (!response.data || !response.data.smog_data) {
      throw new Error('Nieprawidłowa struktura danych API');
    }

    const allData = response.data.smog_data
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
      .map(item => {
        const aqi = calculateAQI(
          item.data?.pm25_avg,
          item.data?.pm10_avg
        );
        
        return {
          id: item.school?.id || Math.random(),
          name: item.school?.name || 'Nieznana lokalizacja',
          city: item.school?.city || '',
          street: item.school?.street || '',
          latitude: parseFloat(item.school?.latitude),
          longitude: parseFloat(item.school?.longitude),
          data: {
            pm25: item.data?.pm25_avg || 0,
            pm10: item.data?.pm10_avg || 0,
            temperature: item.data?.temperature_avg || 0,
            humidity: item.data?.humidity_avg || 0,
            pressure: item.data?.pressure_avg || 0
          },
          aqi: aqi,
          timestamp: item.timestamp || new Date().toISOString()
        };
      });

    const validData = allData.filter(d => d.data.pm25 > 0 && d.data.pm10 > 0);
    const avgPM25 = validData.reduce((sum, d) => sum + d.data.pm25, 0) / validData.length;
    const avgPM10 = validData.reduce((sum, d) => sum + d.data.pm10, 0) / validData.length;
    const avgTemp = validData.reduce((sum, d) => sum + d.data.temperature, 0) / validData.length;
    
    const stats = {
      total: allData.length,
      avgPM25: avgPM25.toFixed(1),
      avgPM10: avgPM10.toFixed(1),
      avgTemperature: avgTemp.toFixed(1),
      good: allData.filter(d => d.aqi.level === 'good').length,
      moderate: allData.filter(d => d.aqi.level === 'moderate').length,
      unhealthy: allData.filter(d => d.aqi.level === 'unhealthy').length,
      veryUnhealthy: allData.filter(d => d.aqi.level === 'very-unhealthy').length,
      hazardous: allData.filter(d => d.aqi.level === 'hazardous').length,
      extreme: allData.filter(d => d.aqi.level === 'extreme').length
    };

    cache.set('airQualityData', { data: allData, stats });
    
    console.log(`Znaleziono ${allData.length} stacji w Polsce`);
    
    res.status(200).json({
      data: allData,
      stats: stats,
      cached: false,
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
