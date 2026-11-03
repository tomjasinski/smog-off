// Dane testowe w formacie źródła (ESA Poland) dla testów przeglądarkowych: bez dostępu do prawdziwego API.
// Znaczniki czasu są świeże (czas polski), żeby stacje nie zostały odrzucone jako nieaktualne.
function warsawTimestamp(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function station({ name, city, street, lat, lng, pm25, pm10, timestamp }) {
  return {
    school: { name, city, street, latitude: lat, longitude: lng },
    data: { pm25_avg: pm25, pm10_avg: pm10, temperature_avg: 9.4, humidity_avg: 82, pressure_avg: 1023 },
    timestamp
  };
}

// Dwa miasta z 5 stacjami (próg podstrony miasta): czystszy Poznań i bardziej zanieczyszczona Warszawa
export function buildFixture(now = new Date()) {
  const timestamp = warsawTimestamp(now);
  const poznan = [18, 19, 20, 21, 22].map((pm25, i) =>
    station({ name: `SP ${i + 1} Poznań`, city: 'POZNAŃ', street: `UL. TESTOWA ${i + 1}`, lat: `52.40${i}00`, lng: `16.92${i}00`, pm25, pm10: pm25 + 8, timestamp })
  );
  const warszawa = [55, 58, 60, 62, 65].map((pm25, i) =>
    station({ name: `SP ${i + 1} Warszawa`, city: 'WARSZAWA', street: `UL. PRÓBNA ${i + 1}`, lat: `52.23${i}00`, lng: `21.01${i}00`, pm25, pm10: pm25 + 15, timestamp })
  );
  return { smog_data: [...poznan, ...warszawa] };
}
