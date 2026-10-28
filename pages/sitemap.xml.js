import { getFreshStations } from '../lib/airQualityServer';
import { getAllPosts } from '../lib/blogPosts';
import { groupCities } from '../lib/cities';
import { SITE_URL } from '../lib/site';

const STATIC_PATHS = ['/', '/stats', '/stacje', '/miasta'];

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function getServerSideProps({ res }) {
  let cityPaths = [];
  try {
    const { stations } = await getFreshStations();
    cityPaths = groupCities(stations).map((c) => `/miasto/${c.slug}`);
  } catch (error) {
    // Bez danych sitemap nadal zawiera strony statyczne i artykuły
    console.error('Sitemap bez miast:', error.message);
  }

  const paths = [
    ...STATIC_PATHS,
    ...cityPaths,
    ...getAllPosts().map((post) => `/blog/${post.slug}`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escapeXml(SITE_URL + p)}</loc></url>`).join('\n')}
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
