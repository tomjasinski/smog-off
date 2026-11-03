import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from './settings';

// Stan ustawień trzyma pages/_app.js (żeby zmiana odświeżyła całą stronę); komponenty czytają go stąd
export const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  openSettings: () => {}
});

export const useSettings = () => useContext(SettingsContext);
