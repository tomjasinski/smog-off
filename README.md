# 🌡️ SmogOFF - Mapa jakości powietrza w Polsce

SmogOFF to interaktywna aplikacja webowa do monitorowania jakości powietrza w czasie rzeczywistym na terenie całej Polski, ze szczególnym uwzględnieniem Poznania.

![SmogOFF Screenshot](docs/screenshot.png)

## ✨ Funkcje

- 🗺️ **Interaktywna mapa** - OpenStreetMap z punktami pomiarowymi
- 📊 **Dane w czasie rzeczywistym** - aktualizowane co 5 minut
- 🎨 **Diagram Woronoja** - wizualizacja zasięgu stacji pomiarowych
- 📱 **Mobile-first** - responsywny design
- 🎯 **Geolokalizacja** - automatyczne centrowanie na lokalizacji użytkownika
- 🔄 **Clustering** - wydajne wyświetlanie setek punktów
- 📝 **Blog** - artykuły o jakości powietrza
- 📊 **Statystyki** - zbiorcze dane dla całej Polski
- 💾 **PWA** - możliwość instalacji jako aplikacja
- 🚀 **Cache** - szybkie ładowanie dzięki Service Worker

## 🎨 Kolory jakości powietrza

Progi pochodzą z [Europejskiego Indeksu Jakości Powietrza (EAQI)](https://airindex.eea.europa.eu/AQI/index.html) Europejskiej Agencji Środowiska (wartości godzinowe, zgodne z wytycznymi WHO 2021). Poziom stacji wyznacza gorszy z dwóch wskaźników.

| Kolor | PM2.5 (µg/m³) | PM10 (µg/m³) | Jakość |
|-------|---------------|--------------|--------|
| 🟢 Zielony | 0 - 5 | 0 - 15 | Dobra |
| 🟡 Limonkowy | 5 - 15 | 15 - 45 | Dość dobra |
| 🟡 Żółty | 15 - 50 | 45 - 120 | Umiarkowana |
| 🟠 Pomarańczowy | 50 - 90 | 120 - 195 | Zła |
| 🔴 Czerwony | 90 - 140 | 195 - 270 | Bardzo zła |
| 🟤 Bordowy | > 140 | > 270 | Ekstremalnie zła |

Pomiary starsze niż 3 godziny nie są pokazywane na mapie ani w rankingach.

## 🚀 Technologie

- **Framework**: Next.js 14
- **Mapa**: Leaflet + React-Leaflet
- **Clustering**: react-leaflet-cluster
- **Diagram Woronoja**: d3-delaunay
- **PWA**: next-pwa
- **Stylowanie**: CSS Modules
- **API**: public-esa.ose.gov.pl
- **Hosting**: Vercel / własny serwer Node.js

## 📦 Instalacja

### Wymagania

- Node.js 18+ 
- npm lub yarn

### Kroki

1. Sklonuj repozytorium:
git clone https://github.com/twoj-username/smogoff.git
cd smogoff

2. Zainstaluj zależności:
npm install

3. Uruchom w trybie development:
npm run dev

4. Otwórz przeglądarkę: `http://localhost:3000`

## 🏗️ Build produkcyjny

Zbuduj aplikację
npm run build

Uruchom produkcyjnie
npm start

Na słabszym komputerze (mało wolnej pamięci RAM) domyślny build może zakończyć się błędem braku pamięci. Wtedy użyj
npm run build:local
który ogranicza liczbę workerów (domyślnie 2; zmienisz to zmienną NEXT_BUILD_CPUS, np. NEXT_BUILD_CPUS=1).

