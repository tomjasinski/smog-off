// Ustawienia użytkownika zapamiętane w przeglądarce (localStorage): motyw, kolory, kontrast, cele dotykowe,
// rozmiar tekstu, animacje, strefy na mapie i miejsce, w którym otwiera się mapa. localStorage może być zablokowany, więc każda operacja jest bezpieczna.
const STORAGE_KEY = 'smogoff.settings';
const LEGACY_THEME_KEY = 'theme';

export const THEMES = ['system', 'light', 'dark'];
export const PALETTES = ['default', 'cvd'];
export const CONTRASTS = ['normal', 'high'];
export const TOUCH_SIZES = ['normal', 'large'];
export const TEXT_SIZES = ['normal', 'large'];
export const MOTIONS = ['auto', 'reduce'];
export const START_MODES = ['last', 'default', 'city', 'station', 'fixed'];

export const DEFAULT_SETTINGS = {
  theme: 'system',
  palette: 'default',
  contrast: 'normal',
  touch: 'normal',
  textSize: 'normal',
  motion: 'auto',
  zones: true,
  start: { mode: 'last' }
};

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

function normalizeStart(raw) {
  const mode = pick(raw?.mode, START_MODES, 'last');
  if (mode === 'last' || mode === 'default') return { mode };
  // city / station / fixed: potrzebne są współrzędne, żeby nie zależeć od danych przy otwieraniu mapy
  if (!isNumber(raw.lat) || !isNumber(raw.lng) || Math.abs(raw.lat) > 90 || Math.abs(raw.lng) > 180) {
    return { mode: 'last' };
  }
  const start = {
    mode,
    lat: raw.lat,
    lng: raw.lng,
    zoom: isNumber(raw.zoom) ? Math.min(Math.max(raw.zoom, 6), 18) : 12,
    label: typeof raw.label === 'string' ? raw.label : ''
  };
  if (mode === 'station' && (typeof raw.id === 'string' || typeof raw.id === 'number')) start.id = String(raw.id);
  return start;
}

export function normalizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    theme: pick(source.theme, THEMES, DEFAULT_SETTINGS.theme),
    palette: pick(source.palette, PALETTES, DEFAULT_SETTINGS.palette),
    contrast: pick(source.contrast, CONTRASTS, DEFAULT_SETTINGS.contrast),
    touch: pick(source.touch, TOUCH_SIZES, DEFAULT_SETTINGS.touch),
    textSize: pick(source.textSize, TEXT_SIZES, DEFAULT_SETTINGS.textSize),
    motion: pick(source.motion, MOTIONS, DEFAULT_SETTINGS.motion),
    zones: typeof source.zones === 'boolean' ? source.zones : DEFAULT_SETTINGS.zones,
    start: normalizeStart(source.start)
  };
}

export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeSettings(JSON.parse(stored));
    // Wcześniej zapamiętywaliśmy tylko motyw
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
    return normalizeSettings({ theme: legacyTheme });
  } catch {
    return normalizeSettings(null);
  }
}

export function clearSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    // magazyn zablokowany: nic do czyszczenia
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // magazyn zablokowany: ustawienia działają do końca sesji
  }
}

// Atrybuty na <html>, według których działają style (motyw, kontrast, rozmiar celów dotykowych).
// Motyw systemowy to brak data-theme (wtedy rządzi prefers-color-scheme).
export function applySettings(settings, root = document.documentElement) {
  if (settings.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-contrast', settings.contrast);
  root.setAttribute('data-touch', settings.touch);
  root.setAttribute('data-text', settings.textSize);
  root.setAttribute('data-motion', settings.motion);
}

// Widok, w którym ma się otworzyć mapa, albo null (wtedy domyślny: Poznań lub lokalizacja, jeśli zgoda już jest).
// lastView to ostatni widok zapamiętany przy zamknięciu strony.
export function resolveStart(settings, lastView) {
  const { start } = settings;
  if (start.mode === 'last') return lastView || null;
  if (start.mode === 'default') return null;
  return { lat: start.lat, lng: start.lng, zoom: start.zoom };
}

// Skrypt wstawiany w <head>: ustawia atrybuty przed pierwszym wyrysowaniem strony (bez migotania motywu)
export const APPLY_SETTINGS_SCRIPT = `(function(){try{var r=document.documentElement,s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'null')||{},t=s.theme;if(!t){t=localStorage.getItem('${LEGACY_THEME_KEY}')}if(t==='light'||t==='dark'){r.setAttribute('data-theme',t)}r.setAttribute('data-contrast',s.contrast==='high'?'high':'normal');r.setAttribute('data-touch',s.touch==='large'?'large':'normal');r.setAttribute('data-text',s.textSize==='large'?'large':'normal');r.setAttribute('data-motion',s.motion==='reduce'?'reduce':'auto')}catch(e){}})();`;
