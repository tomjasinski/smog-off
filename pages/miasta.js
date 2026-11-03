import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';
import LevelBadge from '../components/LevelBadge';
import { paletteColor } from '../lib/aqiLevels';
import { getFreshStations } from '../lib/airQualityServer';
import { groupCities, MIN_STATIONS_FOR_CITY_PAGE } from '../lib/cities';
import pageStyles from '../styles/StatsPage.module.css';
import styles from '../styles/CityPage.module.css';
import { useT } from '../lib/i18n';
import SortSelect from '../components/SortSelect';
import ShareImageButton from '../components/ShareImageButton';
import { QUALITY_SORT_OPTIONS, sortByMode } from '../lib/sorting';
import { renderRankingImage } from '../lib/shareImage';

export async function getStaticProps() {
  const { stations } = await getFreshStations();
  const cities = groupCities(stations).map((c) => ({
    name: c.name,
    slug: c.slug,
    count: c.count,
    pm25: c.pm25,
    pm10: c.pm10,
    label: c.aqi.label,
    color: c.aqi.color
  }));
  return { props: { cities }, revalidate: 600 };
}

const IMAGE_ROWS = 6;

// Grafika do udostępnienia: miasta z najczystszym i najbardziej zanieczyszczonym powietrzem (mediany, jak w statystykach)
function buildCitiesImage(cities, t, locale) {
  const ranked = sortByMode(cities, 'pm25-asc');
  const count = Math.min(IMAGE_ROWS, Math.floor(ranked.length / 2));
  const rows = (list) =>
    list.map((c, i) => ({ rank: i + 1, name: c.name, sub: t('stacji: {count}', { count: c.count }), color: c.color, label: c.label, pm25: c.pm25, pm10: c.pm10 }));
  const kindTitle = (kind) => t('Top {n} {kind}', { n: count, kind: t(kind) });

  return renderRankingImage({
    title: t('Jakość powietrza w miastach'),
    subtitle: t('Mediana odczytów ze wszystkich stacji w mieście (µg/m³), miasta z co najmniej {min} stacjami.', { min: MIN_STATIONS_FOR_CITY_PAGE }),
    sections: [
      { title: kindTitle('najczystsze'), accent: '#4ade80', rows: rows(ranked.slice(0, count)) },
      { title: kindTitle('najbardziej zanieczyszczone'), accent: '#ef4444', rows: rows(ranked.slice(-count).reverse()) }
    ],
    footer: [t('Dane: ESA Poland'), t('progi EAQI (EEA, WHO 2021)')].join(' · '),
    locale
  });
}

export default function CitiesPage({ cities }) {
  const { t, locale } = useT();
  const [sort, setSort] = useState('name');
  const sorted = useMemo(() => sortByMode(cities, sort), [cities, sort]);
  const title = t('Jakość powietrza w polskich miastach | SmogOFF');
  const description = t('Aktualna jakość powietrza (PM2.5 i PM10) w {count} polskich miastach z co najmniej {min} stacjami pomiarowymi.', { count: cities.length, min: MIN_STATIONS_FOR_CITY_PAGE });

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <main className={pageStyles.container}>
        <Link href="/" className={pageStyles.backLink}>{t('← Powrót do mapy')}</Link>
        {' · '}
        <Link href="/stats" className={pageStyles.backLink}>{t('Statystyki')}</Link>

        <article className={pageStyles.article}>
          <h1>{t('Jakość powietrza w miastach')}</h1>
          <p className={styles.lead}>
            {t('Miasta z co najmniej {min} stacjami pomiarowymi. Wartości to mediany odczytów (µg/m³).', { min: MIN_STATIONS_FOR_CITY_PAGE })}{' '}
            {t('Pozostałe miejscowości znajdziesz na')} <Link href="/stacje">{t('liście stacji')}</Link>.
          </p>

          <SortSelect value={sort} onChange={setSort} options={QUALITY_SORT_OPTIONS} />

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('Miasto i poziom')}</th>
                  <th scope="col">PM2.5</th>
                  <th scope="col">PM10</th>
                  <th scope="col">{t('Stacji')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.slug}>
                    <th scope="row" style={{ borderLeft: `6px solid ${paletteColor(c.color)}` }}>
                      <Link href={`/miasto/${c.slug}`} className={styles.cityLink}>{c.name}</Link>
                      <span className={styles.levelRow}><LevelBadge color={c.color} label={c.label} /></span>
                    </th>
                    <td className={styles.value} style={{ backgroundColor: `${paletteColor(c.color)}40` }}>{c.pm25}</td>
                    <td className={styles.value} style={{ backgroundColor: `${paletteColor(c.color)}40` }}>{c.pm10}</td>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cities.length >= 2 && (
            <ShareImageButton
              title={t('Jakość powietrza w miastach')}
              text={t('Jakość powietrza w polskich miastach (SmogOFF)')}
              render={() => buildCitiesImage(cities, t, locale)}
            />
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
