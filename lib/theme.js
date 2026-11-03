// Motyw jasny/ciemny: domyślnie systemowy; wybór użytkownika to data-theme na <html> (ustawiany w lib/settings.js).
// Skrypt w pages/_document.js ustawia zapamiętany wybór przed pierwszym wyrysowaniem strony.
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getResolvedTheme() {
  if (typeof document === 'undefined') return 'dark';
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
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
