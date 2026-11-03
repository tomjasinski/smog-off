// Build produkcyjny na komputerach z małą ilością pamięci.
// Domyślny `next build` używa tylu workerów, ile jest rdzeni, a każdy potrafi zająć ponad 1 GB, więc na laptopie z 8 GB RAM
// i bez dużego pliku stronicowania proces kończył się błędem alokacji (kod 3221226505). Tutaj:
//   - jeden worker (NEXT_BUILD_CPUS=1), zmienisz np. NEXT_BUILD_CPUS=2 npm run build:local
//   - limit sterty Node 700 MB (NEXT_BUILD_HEAP_MB=700)
import { spawnSync } from 'node:child_process';
import { freemem } from 'node:os';

const cpus = process.env.NEXT_BUILD_CPUS || '1';
const heapMb = process.env.NEXT_BUILD_HEAP_MB || '700';

const freeMb = Math.round(freemem() / 1024 / 1024);
console.log(`Wolna pamięć RAM: ${freeMb} MB; workerów: ${cpus}; limit sterty: ${heapMb} MB`);
if (freeMb < 1200) {
  console.warn('Uwaga: mało wolnej pamięci. Zamknij zbędne programy i serwery dev/start, bo build może się nie udać.');
}

// Kopiuje worker MapLibre do public/ (robi to też hook prebuild przy zwykłym `npm run build`)
await import('./copy-maplibre-worker.mjs');

const nodeOptions = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=${heapMb}`.trim();
const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_BUILD_CPUS: cpus, NODE_OPTIONS: nodeOptions }
});

process.exit(result.status ?? 1);
