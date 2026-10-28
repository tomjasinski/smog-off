// Build produkcyjny z ograniczoną liczbą workerów, na komputerach z małą ilością wolnego RAM-u
// (domyślny build używa tylu workerów, ile jest rdzeni, i potrafi zakończyć się błędem braku pamięci).
// Liczbę workerów zmienisz zmienną NEXT_BUILD_CPUS, np. NEXT_BUILD_CPUS=1 npm run build:local
import { spawnSync } from 'node:child_process';

// Kopiuje worker MapLibre do public/ (robi to też hook prebuild przy zwykłym `npm run build`)
await import('./copy-maplibre-worker.mjs');

const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_BUILD_CPUS: process.env.NEXT_BUILD_CPUS || '2' }
});

process.exit(result.status ?? 1);
