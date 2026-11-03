import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/LanguageSwitch.module.css';

const LANGUAGES = [
  { locale: 'pl', label: 'Polski', lang: 'pl' },
  { locale: 'en', label: 'English', lang: 'en' }
];

// Przełącznik języka: ten sam adres w drugim języku (Link z locale). Aktualny język jest oznaczony aria-current.
export default function LanguageSwitch({ className = '' }) {
  const router = useRouter();

  return (
    <span className={`${styles.switch} ${className}`}>
      {LANGUAGES.map(({ locale, label, lang }) => {
        const current = router.locale === locale;
        return (
          <Link
            key={locale}
            href={{ pathname: router.pathname, query: router.query }}
            locale={locale}
            lang={lang}
            hrefLang={lang}
            className={`${styles.link} ${current ? styles.current : ''}`}
            aria-current={current ? 'true' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </span>
  );
}
