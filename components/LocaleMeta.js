import Head from 'next/head';
import { useRouter } from 'next/router';
import { SITE_URL } from '../lib/site';
import { localePrefix } from '../lib/i18n';

// Adres kanoniczny i alternatywy językowe (hreflang) dla każdej strony.
// Artykuły na blogu są tylko po polsku, więc wersja /en/blog/... wskazuje polski adres i nie ma alternatyw.
export default function LocaleMeta() {
  const { asPath, locale = 'pl' } = useRouter();
  const path = asPath.split(/[?#]/)[0].replace(/\/$/, '');
  const isBlog = path.startsWith('/blog');
  const url = (lang) => `${SITE_URL}${localePrefix(lang)}${path}` || SITE_URL;

  if (isBlog) {
    return (
      <Head>
        <link rel="canonical" href={url('pl')} key="canonical" />
      </Head>
    );
  }

  return (
    <Head>
      <link rel="canonical" href={url(locale)} key="canonical" />
      <link rel="alternate" hrefLang="pl" href={url('pl')} key="alt-pl" />
      <link rel="alternate" hrefLang="en" href={url('en')} key="alt-en" />
      <link rel="alternate" hrefLang="x-default" href={url('pl')} key="alt-default" />
    </Head>
  );
}
