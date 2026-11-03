import Head from 'next/head';
import Link from 'next/link';
import Footer from '../../components/Footer';
import LevelBadge from '../../components/LevelBadge';
import { WhoNote, StaleNote } from '../../components/StationInsights';
import SocialMeta from '../../components/SocialMeta';
import { getFreshStations } from '../../lib/airQualityServer';
import { groupCities, citySlug } from '../../lib/cities';
import { matchesStation, stationKey, hashId } from '../../lib/stationKey';
import pageStyles from '../../styles/StatsPage.module.css';
import { useT } from '../../lib/i18n';

const REVALIDATE_SECONDS = 600;

// Strony stacji powstają przy pierwszym wejściu (jest ich ponad tysiąc, a służą głównie jako cel udostępniania z podglądem linku)
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { stations } = await getFreshStations();
  const station = stations.find((s) => matchesStation(s, params.id));
  if (!station) return { notFound: true, revalidate: REVALIDATE_SECONDS };

  const hasCityPage = groupCities(stations).some((c) => c.slug === citySlug(station.city));

  return {
    props: {
      station: {
        id: String(station.id),
        key: stationKey(station),
        hash: hashId(station.id),
        name: station.name,
        city: station.city,
        street: station.street,
        pm25: station.data.pm25,
        pm10: station.data.pm10,
        temperature: station.data.temperature,
        label: station.aqi.label,
        color: station.aqi.color,
        timestamp: station.timestamp
      },
      cityPath: hasCityPage ? citySlug(station.city) : null
    },
    revalidate: REVALIDATE_SECONDS
  };
}

export default function StationPage({ station, cityPath }) {
  const { t } = useT();
  const path = `/stacja/${encodeURIComponent(station.key)}`;
  const title = t('{name} – jakość powietrza | SmogOFF', { name: station.name });
  const description = t('{name}: PM2.5 {pm25} µg/m³, PM10 {pm10} µg/m³, poziom: {level}.', {
    name: `${station.name}${station.city ? `, ${station.city}` : ''}`,
    pm25: station.pm25,
    pm10: station.pm10,
    level: t(station.label)
  });

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {/* Strona służy udostępnianiu: nie indeksujemy ponad tysiąca podobnych podstron */}
        <meta name="robots" content="noindex, follow" />
      </Head>
      <SocialMeta
        title={title}
        description={description}
        path={path}
        image={`/api/og?station=${station.hash}`}
      />

      <main className={pageStyles.container}>
        <Link href="/" className={pageStyles.backLink}>{t('← Powrót do mapy')}</Link>

        <article className={pageStyles.article}>
          <h1>{station.name}</h1>
          <p>
            {station.city}
            {station.street ? `, ${station.street}` : ''}
          </p>
          <p>
            {t('Aktualny poziom:')} <LevelBadge color={station.color} label={station.label} />
          </p>

          <div className={pageStyles.statsGrid}>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>PM2.5</span>
              <span className={pageStyles.statValue}>{station.pm25} µg/m³</span>
            </div>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>PM10</span>
              <span className={pageStyles.statValue}>{station.pm10} µg/m³</span>
            </div>
            <div className={pageStyles.statCard}>
              <span className={pageStyles.statLabel}>{t('Temperatura')}</span>
              <span className={pageStyles.statValue}>{station.temperature} °C</span>
            </div>
          </div>

          <WhoNote pm25={station.pm25} pm10={station.pm10} />

          <p>
            <Link href={{ pathname: '/', query: { station: station.hash } }}>{t('Zobacz stację na mapie →')}</Link>
            {cityPath && (
              <>
                {' · '}
                <Link href={`/miasto/${cityPath}`}>{t('Jakość powietrza w mieście {city}', { city: station.city })}</Link>
              </>
            )}
          </p>
          <p>{t('Pomiar z {time}.', { time: station.timestamp ? station.timestamp.slice(0, 16) : '–' })}</p>
          <StaleNote timestamp={station.timestamp} />
        </article>
      </main>
      <Footer />
    </>
  );
}
