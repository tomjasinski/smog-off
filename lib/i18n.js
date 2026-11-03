import { useMemo } from 'react';
import { useRouter } from 'next/router';
import en from './locales/en';

// Tłumaczenia: w kodzie zostają polskie teksty (t('Powrót do mapy')), a słownik locales/en.js zawiera ich angielskie wersje.
// Brak tłumaczenia daje tekst polski, a test (tests/i18n.test.js) pilnuje, żeby żaden tekst z kodu nie został bez angielskiego.
// Treści artykułów na blogu pozostają po polsku.
export const LOCALES = ['pl', 'en'];
export const DEFAULT_LOCALE = 'pl';

const DICTIONARIES = { en };

export function translate(locale, text, vars) {
  const dictionary = DICTIONARIES[locale];
  const translated = dictionary?.[text] ?? text;
  if (!vars) return translated;
  return translated.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

// Format dat i liczb zgodny z językiem strony
export const intlLocale = (locale) => (locale === 'en' ? 'en-GB' : 'pl-PL');

// Prefiks ścieżki dla języka (polski jest domyślny, bez prefiksu)
export const localePrefix = (locale) => (locale === 'en' ? '/en' : '');

export function useT() {
  const { locale = DEFAULT_LOCALE } = useRouter();
  return useMemo(() => ({ t: (text, vars) => translate(locale, text, vars), locale }), [locale]);
}
