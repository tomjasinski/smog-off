// Next/Turbopack nie potrafi poprawnie wskazać pliku workera MapLibre (import.meta.url),
// więc kopiujemy go do public/ i ustawiamy ścieżkę przez setWorkerUrl (patrz components/Map.js).
import { copyFileSync, existsSync } from 'node:fs';

const source = 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs';
if (existsSync(source)) {
  copyFileSync(source, 'public/maplibre-gl-worker.mjs');
}
