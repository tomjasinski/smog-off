import { createContext, useContext } from 'react';

// Wybór palety kolorów (zwykła lub dla osób z daltonizmem) zapamiętany w przeglądarce.
// Stan trzyma pages/_app.js, a kolory zamienia paletteColor() z lib/aqiLevels.js.
const STORAGE_KEY = 'smogoff.palette';

export function loadPalette() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'cvd' ? 'cvd' : 'default';
  } catch {
    return 'default';
  }
}

export function savePalette(palette) {
  try {
    localStorage.setItem(STORAGE_KEY, palette);
  } catch {
    // magazyn zablokowany: wybór działa do końca sesji
  }
}

export const PaletteContext = createContext({ palette: 'default', setPalette: () => {} });

export const usePalette = () => useContext(PaletteContext);
