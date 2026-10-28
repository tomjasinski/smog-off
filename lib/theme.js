// Motyw jasny/ciemny: domyślnie systemowy; wybór użytkownika (data-theme na <html>) zapamiętany w localStorage.
// Skrypt w pages/_document.js ustawia zapamiętany wybór przed pierwszym wyrysowaniem strony.
const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getResolvedTheme() {
  if (typeof document === 'undefined') return 'dark';
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage może być zablokowany (tryb prywatny); motyw działa do końca sesji
  }
}

// Wywołuje callback przy zmianie motywu (ręcznej lub systemowej). Zwraca funkcję odsubskrybowania.
export function subscribeTheme(callback) {
  const observer = new MutationObserver(() => callback(getResolvedTheme()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const media = window.matchMedia(DARK_QUERY);
  const onMedia = () => callback(getResolvedTheme());
  media.addEventListener('change', onMedia);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onMedia);
  };
}
