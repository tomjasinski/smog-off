import { getFreshStations } from '../lib/airQualityServer';
import { getAllPosts } from '../lib/blogPosts';
import { groupCities } from '../lib/cities';
import { SITE_URL } from '../lib/site';
import { LOCALES, localePrefix } from '../lib/i18n';

const STATIC_PATHS = ['/', '/stats', '/stacje', '/miasta', '/o-danych'];

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urlFor = (path, locale) => `${SITE_URL}${localePrefix(locale)}${path === '/' ? '' : path}`;

// Strony dostępne w obu językach: każdy adres z alternatywami (hreflang)
function localizedEntry(path, locale) {
  const alternates = [
    ...LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(urlFor(path, l))}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urlFor(path, 'pl'))}"/>`
  ];
  return `  <url>\n    <loc>${escapeXml(urlFor(path, locale))}</loc>\n${alternates.join('\n')}\n  </url>`;
}

export async function getServerSideProps({ res }) {
  let cityPaths = [];
  try {
    const { stations } = await getFreshStations();
    cityPaths = groupCities(stations).map((c) => `/miasto/${c.slug}`);
  } catch (error) {
    // Bez danych sitemap nadal zawiera strony statyczne i artykuły
    console.error('Sitemap bez miast:', error.message);
  }

  const localizedPaths = [...STATIC_PATHS, ...cityPaths];
  // Artykuły są tylko po polsku, więc bez wersji /en
  const blogPaths = getAllPosts().map((post) => `/blog/${post.slug}`);

  const entries = [
    ...localizedPaths.flatMap((path) => LOCALES.map((locale) => localizedEntry(path, locale))),
    ...blogPaths.map((path) => `  <url><loc>${escapeXml(urlFor(path, 'pl'))}</loc></url>`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(body);
  res.end();
  return { props: {} };
}

export default function SiteMap() {
  return null;
}
