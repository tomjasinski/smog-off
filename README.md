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

| Kolor | PM2.5 (µg/m³) | PM10 (µg/m³) | Jakość |
|-------|---------------|--------------|--------|
| 🟢 Zielony | 0 - 12 | 0 - 54 | Dobra |
| 🟡 Żółty | 12.1 - 35.4 | 55 - 154 | Średnia |
| 🟠 Pomarańczowy | 35.5 - 55.4 | 155 - 254 | Niezdrowa |
| 🔴 Czerwony | 55.5 - 150.4 | 255 - 354 | Bardzo zła |
| 🟣 Fioletowy | 150.5 - 250.4 | 355 - 424 | Niebezpieczna |
| 🟤 Bordowy | 250.5+ | 425+ | Ekstremalnie zła |

*Normy oparte na standardach WHO/EPA*

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

