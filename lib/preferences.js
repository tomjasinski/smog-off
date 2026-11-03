// Preferencje użytkownika zapamiętane w przeglądarce (localStorage): ostatni widok mapy i ulubione stacje.
// localStorage może być zablokowany (tryb prywatny), więc każda operacja jest bezpieczna i po cichu się poddaje.
const KEYS = {
  view: 'smogoff.view',
  favorites: 'smogoff.favorites'
};

export const MAX_FAVORITES = 3;
export const MIN_ZOOM = 6;
export const MAX_ZOOM = 18;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // brak miejsca lub zablokowany magazyn: preferencje działają do końca sesji
  }
}

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

// Zwraca { lat, lng, zoom } albo null, gdy nic nie zapamiętano lub zapis jest uszkodzony
export function normalizeView(raw) {
  if (!raw || !isNumber(raw.lat) || !isNumber(raw.lng) || !isNumber(raw.zoom)) return null;
  if (Math.abs(raw.lat) > 90 || Math.abs(raw.lng) > 180) return null;
  return { lat: raw.lat, lng: raw.lng, zoom: Math.min(Math.max(raw.zoom, MIN_ZOOM), MAX_ZOOM) };
}

export const loadView = () => normalizeView(read(KEYS.view));
export const saveView = (view) => write(KEYS.view, view);

export function normalizeFavorites(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const list = [];
  for (const item of raw) {
    if (!item || (typeof item.id !== 'string' && typeof item.id !== 'number')) continue;
    const id = String(item.id);
    if (seen.has(id)) continue;
    seen.add(id);
    list.push({ id, name: typeof item.name === 'string' ? item.name : '' });
  }
  return list.slice(0, MAX_FAVORITES);
}

export const loadFavorites = () => normalizeFavorites(read(KEYS.favorites));
export const saveFavorites = (list) => write(KEYS.favorites, list);

// Dodaje stację do ulubionych albo ją usuwa. status: 'added' | 'removed' | 'full' (limit MAX_FAVORITES)
export function toggleFavorite(list, station) {
  const id = String(station.id);
  if (list.some((f) => f.id === id)) {
    return { list: list.filter((f) => f.id !== id), status: 'removed' };
  }
  if (list.length >= MAX_FAVORITES) return { list, status: 'full' };
  return { list: [...list, { id, name: station.name }], status: 'added' };
}
