import Head from 'next/head';
import Link from 'next/link';
import Footer from '../../components/Footer';
import StationArticles from '../../components/StationArticles';
import LevelBadge from '../../components/LevelBadge';
import { getFreshStations } from '../../lib/airQualityServer';
import { getAllPosts } from '../../lib/blogPosts';
import { groupCities } from '../../lib/cities';
import { SITE_URL } from '../../lib/site';
import { getReadableTextColor } from '../../lib/aqiLevels';
import pageStyles from '../../styles/StatsPage.module.css';
import styles from '../../styles/CityPage.module.css';

const REVALIDATE_SECONDS = 600;
// Ile innych miast pokazujemy na dole strony (miasta z największą liczbą stacji; linkowanie wewnętrzne)
const OTHER_CITIES_COUNT = 20;

export async function getStaticPaths() {
  try {
    const { stations } = await getFreshStations();
    return {
      paths: groupCities(stations).map((city) => ({ params: { slug: city.slug } })),
      fallback: 'blocking'
    };
  } catch (error) {
    // Bez danych w czasie budowania strony powstaną przy pierwszym wejściu
    console.error('Nie udało się pobrać listy miast:', error.message);
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  // Przy błędzie źródła Next zachowa poprzednio wygenerowaną stronę
  const { stations } = await getFreshStations();
  const cities = groupCities(stations);
  const city = cities.find((c) => c.slug === params.slug);
  if (!city) return { notFound: true, revalidate: REVALIDATE_SECONDS };

  const lat = city.stations.reduce((sum, s) => sum + s.latitude, 0) / city.count;
  const lng = city.stations.reduce((sum, s) => sum + s.longitude, 0) / city.count;

  return {
    props: {
      city: {
        name: city.name,
        slug: city.slug,
        count: city.count,
        pm25: city.pm25,
        pm10: city.pm10,
        level: city.aqi.level,
        label: city.aqi.label,
        color: city.aqi.color,
        lat,
        lng,
        stations: [...city.stations]
          .sort((a, b) => b.data.pm25 - a.data.pm25)
          .map((s) => ({
            id: s.id,
            name: s.name,
            street: s.street,
            pm25: s.data.pm25,
            pm10: s.data.pm10,
            label: s.aqi.label,
            color: s.aqi.color,
            timestamp: s.timestamp
          }))
      },
      others: cities
        .filter((c) => c.slug !== city.slug)
        .sort((a, b) => b.count - a.count)
        .slice(0, OTHER_CITIES_COUNT)
        .map((c) => ({ name: c.name, slug: c.slug, color: c.aqi.color, pm25: c.pm25 })),
      posts: getAllPosts().map(({ slug, title }) => ({ slug, title })),
      generatedAt: new Date().toISOString()
    },
    revalidate: REVALIDATE_SECONDS
  };
}

const timeOf = (timestamp) => (timestamp ? timestamp.slice(11, 16) : '–');

export default function CityPage({ city, others, posts, generatedAt }) {
  const url = `${SITE_URL}/miasto/${city.slug}`;
  const title = `Jakość powietrza ${city.name} – smog na żywo | SmogOFF`;
  const description = `Jakość powietrza – ${city.name}: aktualne PM2.5 ${city.pm25} µg/m³, PM10 ${city.pm10} µg/m³, poziom: ${city.label}. Dane na podstawie ${city.count} stacji pomiarowych, aktualizowane na bieżąco.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
      </Head>

      <main className={pageStyles.container}>
        <Link href="/" className={pageStyles.backLink}>← Powrót do mapy</Link>
        {' · '}
        <Link href="/miasta" className={pageStyles.backLink}>Wszystkie miasta</Link>

        <article className={pageStyles.article}>
          <h1>Jakość powietrza: {city.name}</h1>

          <p className={styles.lead}>
            Aktualny poziom:{' '}
            <span className={styles.badge} style={{ backgroundColor: city.color, color: getReadableTextColor(city.color) }}>
              {city.label}
            </span>
            . Wartości to mediana odczytów (µg/m³) na podstawie {city.count} stacji w mieście, więc pojedynczy błędny czujnik nie zniekształca wyniku.
          </p>

          <div className={pageStyles.statsGrid}>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>PM2.5 (mediana)</span>
              <span className={pageStyles.statValue}>{city.pm25} µg/m³</span>
            </div>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>PM10 (mediana)</span>
              <span className={pageStyles.statValue}>{city.pm10} µg/m³</span>
            </div>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>Stacji pomiarowych</span>
              <span className={pageStyles.statValue}>{city.count}</span>
            </div>
          </div>

          <section className={styles.section} aria-labelledby="stacje-miasta">
            <h2 id="stacje-miasta">Stacje pomiarowe w mieście {city.name}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Stacja i poziom</th>
                    <th scope="col">PM2.5</th>
                    <th scope="col">PM10</th>
                  </tr>
                </thead>
                <tbody>
                  {city.stations.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" style={{ borderLeft: `6px solid ${s.color}` }}>
                        <span className={styles.stationName}>{s.name}</span>
                        {s.street && <span className={styles.street}>{s.street}</span>}
                        <span className={styles.levelRow}>
                          <LevelBadge color={s.color} label={s.label} />
                          <span className={styles.time}>pomiar {timeOf(s.timestamp)}</span>
                        </span>
                      </th>
                      <td className={styles.value} style={{ backgroundColor: `${s.color}40` }}>{s.pm25}</td>
                      <td className={styles.value} style={{ backgroundColor: `${s.color}40` }}>{s.pm10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className={styles.mapLink}>
            <Link href={`/?lat=${city.lat.toFixed(4)}&lng=${city.lng.toFixed(4)}&zoom=12`}>
              Zobacz stacje miasta {city.name} na mapie →
            </Link>
          </p>

          <StationArticles level={city.level} posts={posts} />

          {others.length > 0 && (
            <nav className={styles.section} aria-labelledby="inne-miasta">
              <h2 id="inne-miasta">Inne miasta</h2>
              <ul className={styles.cityList}>
                {others.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/miasto/${c.slug}`}>
                      <span className={styles.dot} style={{ backgroundColor: c.color }} aria-hidden="true"></span>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className={styles.note}>
            Dane: ESA Poland. Poziomy wg Europejskiego Indeksu Jakości Powietrza (EAQI). Strona odświeżana co kilkanaście minut
            (wygenerowano {generatedAt.slice(0, 16).replace('T', ' ')} UTC). Pomijamy pomiary starsze niż kilka godzin i odczyty poniżej 1 µg/m³.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
