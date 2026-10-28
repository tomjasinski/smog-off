import { getReadableTextColor } from '../lib/aqiLevels';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AQI_LEVEL_LIST, calculateAQI, describeRange } from '../lib/aqiLevels';
import { cityPageSlugs } from '../lib/cities';
import CityLink from '../components/CityLink';
import LevelBadge from '../components/LevelBadge';
import { MAX_DATA_AGE_HOURS } from '../lib/freshness';
import ShareImageButton from '../components/ShareImageButton';
import { renderRankingImage, renderDistributionImage } from '../lib/shareImage';
import styles from '../styles/StatsPage.module.css';

// Liczby w segmentach paska pokazujemy tylko, gdy segment jest dość szeroki (wąskie by się nakładały)
const MIN_SEGMENT_SHARE_FOR_LABEL = 0.06;

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/air-quality');
      const result = await response.json();
      
      if (result.stats) {
        setStats(result.stats);
        setStations(result.data || []);
        setUpdatedAt(result.data?.[0]?.timestamp || null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <p>Nie udało się załadować statystyk</p>
      </div>
    );
  }

  const RANKING_SIZE = 10;
  const ranked = stations
    // Odczyty poniżej 1 µg/m³ (PM2.5 lub PM10) traktujemy jako podejrzane i pomijamy w rankingu
    .filter(s => s.data.pm25 >= 1 && s.data.pm10 >= 1)
    .sort((a, b) => a.data.pm25 - b.data.pm25 || a.data.pm10 - b.data.pm10);
  const cleanest = ranked.slice(0, RANKING_SIZE);
  const dirtiest = ranked.slice(-RANKING_SIZE).reverse();

  // Ranking miast: mediana jest odporna na pojedyncze błędne czujniki, a małe miejscowości pomijamy
  const MIN_STATIONS_PER_CITY = 3;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const round1 = (v) => Math.round(v * 10) / 10;
  const cityGroups = ranked.reduce((acc, s) => {
    const city = s.city.trim();
    if (!city) return acc;
    (acc[city] = acc[city] || []).push(s);
    return acc;
  }, {});
  const cities = Object.entries(cityGroups)
    .filter(([, list]) => list.length >= MIN_STATIONS_PER_CITY)
    .map(([city, list]) => {
      const pm25 = round1(median(list.map(s => s.data.pm25)));
      const pm10 = round1(median(list.map(s => s.data.pm10)));
      return { city, count: list.length, pm25, pm10, aqi: calculateAQI(pm25, pm10) };
    })
    .sort((a, b) => a.pm25 - b.pm25 || a.pm10 - b.pm10);
  const cleanestCities = cities.slice(0, RANKING_SIZE);
  const dirtiestCities = cities.slice(-RANKING_SIZE).reverse();

  // Miasta z własną podstroną (co najmniej MIN_STATIONS_FOR_CITY_PAGE stacji) są klikalne
  const citySlugs = cityPageSlugs(stations);

  const renderCityRanking = (title, list, id, share) => (
    <section className={styles.rankingColumn} aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <ol className={styles.rankingList}>
        {list.map(c => (
          <li key={c.city} className={styles.rankingItem} style={{ borderLeftColor: c.aqi.color }}>
            <span className={styles.rankingDot} style={{ backgroundColor: c.aqi.color }} aria-hidden="true"></span>
            <span className={styles.rankingName}>
              <strong>
                <CityLink name={c.city} slugs={citySlugs} className={styles.rankingLink} />
              </strong>
              <span className={styles.rankingCity}>stacji: {c.count}</span>
              <span className={styles.rankingLevel}><LevelBadge color={c.aqi.color} label={c.aqi.label} small /></span>
            </span>
            <span className={styles.rankingValues}>
              <span>PM2.5: <strong>{c.pm25}</strong></span>
              <span>PM10: <strong>{c.pm10}</strong></span>
            </span>
          </li>
        ))}
      </ol>
      {share && <ShareImageButton title={share.title} text={share.text} render={share.render} />}
    </section>
  );

  const renderRanking = (title, list, id, share) => (
    <section className={styles.rankingColumn} aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <ol className={styles.rankingList}>
        {list.map(s => (
          <li key={s.id} className={styles.rankingItem} style={{ borderLeftColor: s.aqi.color }}>
            <span className={styles.rankingDot} style={{ backgroundColor: s.aqi.color }} aria-hidden="true"></span>
            <span className={styles.rankingName}>
              <strong>{s.name}</strong>
              {s.city && (
                <span className={styles.rankingCity}>
                  <CityLink name={s.city} slugs={citySlugs} className={styles.rankingLink} />
                </span>
              )}
              <span className={styles.rankingLevel}><LevelBadge color={s.aqi.color} label={s.aqi.label} small /></span>
            </span>
            <span className={styles.rankingValues}>
              <span>PM2.5: <strong>{s.data.pm25}</strong></span>
              <span>PM10: <strong>{s.data.pm10}</strong></span>
            </span>
          </li>
        ))}
      </ol>
      {share && <ShareImageButton title={share.title} text={share.text} render={share.render} />}
    </section>
  );

  const imageFooter = () =>
    [
      'Dane: ESA Poland',
      'progi EAQI (EEA, WHO 2021)',
      updatedAt ? `pomiar z ${updatedAt.slice(0, 16).replace('T', ' ')}` : null
    ].filter(Boolean).join(' · ');

  const stationRows = (list) =>
    list.map((s, i) => ({ rank: i + 1, name: s.name, sub: s.city, color: s.aqi.color, label: s.aqi.label, pm25: s.data.pm25, pm10: s.data.pm10 }));
  const cityRows = (list) =>
    list.map((c, i) => ({ rank: i + 1, name: c.city, sub: `stacji: ${c.count}`, color: c.aqi.color, label: c.aqi.label, pm25: c.pm25, pm10: c.pm10 }));

  // Każdy ranking (najczystsze / najbardziej zanieczyszczone) ma własną grafikę
  const rankingShare = ({ title, subtitle, kind, accent, rows }) => ({
    title,
    text: `${title} w Polsce (SmogOFF)`,
    render: () =>
      renderRankingImage({
        title,
        subtitle,
        sections: [{ title: `Top ${rows.length} ${kind}`, accent, rows }],
        footer: imageFooter()
      })
  });
  const STATIONS_SUBTITLE = 'Najnowsze dane z sieci czujników (µg/m³), sortowane wg PM2.5.';
  const CITIES_SUBTITLE = `Mediana odczytów ze wszystkich stacji w mieście (µg/m³), miasta z co najmniej ${MIN_STATIONS_PER_CITY} stacjami.`;
  const BEST = '#4ade80';
  const WORST = '#ef4444';

  const renderDistribution = () =>
    renderDistributionImage({
      title: 'Jakość powietrza w Polsce',
      subtitle: `Rozkład ${stats.total} stacji pomiarowych według poziomu jakości powietrza.`,
      stats,
      footer: imageFooter()
    });

  return (
    <>
      <Head>
        <title>Statystyki jakości powietrza - SmogOFF</title>
        <meta name="description" content="Zbiorcze statystyki jakości powietrza w Polsce: średnie stężenia PM2.5 i PM10 oraz liczba stacji w poszczególnych kategoriach." />
      </Head>

      <main className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Powrót do mapy
        </Link>
        {' · '}
        <Link href="/stacje" className={styles.backLink}>
          Lista wszystkich stacji
        </Link>

        <article className={styles.article}>
          <h1>📊 Statystyki dla Polski</h1>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Stacji pomiarowych</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Średnie PM2.5</span>
              <span className={styles.statValue}>{stats.avgPM25} µg/m³</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Średnie PM10</span>
              <span className={styles.statValue}>{stats.avgPM10} µg/m³</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Temperatura</span>
              <span className={styles.statValue}>{stats.avgTemperature}°C</span>
            </div>
          </div>
          
          <div className={styles.aqiDistribution}>
            <h2>Jakość powietrza w Polsce</h2>
            <div className={styles.aqiBar} role="img" aria-label="Rozkład stacji według jakości powietrza">
              {AQI_LEVEL_LIST.map(({ level, color, label }) => {
                const count = stats.levels[level] || 0;
                return (
                  <div
                    key={level}
                    className={styles.aqiSegment}
                    style={{
                      width: `${(count / stats.total * 100)}%`,
                      backgroundColor: color,
                      color: getReadableTextColor(color)
                    }}
                    title={`${label}: ${count}`}
                  >
                    {count / stats.total >= MIN_SEGMENT_SHARE_FOR_LABEL && <span>{count}</span>}
                  </div>
                );
              })}
            </div>

            <div className={styles.statsLegend}>
              {AQI_LEVEL_LIST.map(({ level, color, label }) => {
                const count = stats.levels[level] || 0;
                return (
                  <div key={level} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{backgroundColor: color}}></span>
                    <span className={styles.legendLabel}>{label}</span>
                    <span className={styles.legendValue}>{count} <span className={styles.legendShare}>({((count / stats.total) * 100).toFixed(1)}%)</span></span>
                  </div>
                );
              })}
            </div>

            <ShareImageButton
              title="Jakość powietrza w Polsce"
              text="Rozkład stacji pomiarowych według jakości powietrza (SmogOFF)"
              render={renderDistribution}
            />
          </div>

          {ranked.length > 0 && (
            <div className={styles.rankingSection}>
              <h2>Ranking punktów pomiarowych</h2>
              <p className={styles.rankingNote}>
                Najnowsze dane z sieci czujników (µg/m³), sortowane wg PM2.5. Pomijamy odczyty poniżej 1 µg/m³.
                {updatedAt && ` Pomiar z ${updatedAt.slice(0, 16)}.`}
              </p>
              <div className={styles.rankingGrid}>
                {renderRanking(`Top ${cleanest.length} najczystsze`, cleanest, 'ranking-best', rankingShare({ title: 'Najczystsze punkty pomiarowe', subtitle: STATIONS_SUBTITLE, kind: 'najczystsze', accent: BEST, rows: stationRows(cleanest) }))}
                {renderRanking(`Top ${dirtiest.length} najbardziej zanieczyszczone`, dirtiest, 'ranking-worst', rankingShare({ title: 'Najbardziej zanieczyszczone punkty pomiarowe', subtitle: STATIONS_SUBTITLE, kind: 'najbardziej zanieczyszczone', accent: WORST, rows: stationRows(dirtiest) }))}
              </div>
            </div>
          )}

          {cities.length > 0 && (
            <div className={styles.rankingSection}>
              <h2>Ranking miast</h2>
              <p className={styles.rankingNote}>
                Mediana odczytów ze wszystkich stacji w mieście (µg/m³), sortowana wg PM2.5.
                Uwzględniamy miasta z co najmniej {MIN_STATIONS_PER_CITY} stacjami ({cities.length} miast).
                Mediana jest odporna na pojedyncze błędne czujniki.
              </p>
              <div className={styles.rankingGrid}>
                {renderCityRanking(`Top ${cleanestCities.length} najczystsze miasta`, cleanestCities, 'ranking-cities-best', rankingShare({ title: 'Najczystsze miasta', subtitle: CITIES_SUBTITLE, kind: 'najczystsze', accent: BEST, rows: cityRows(cleanestCities) }))}
                {renderCityRanking(`Top ${dirtiestCities.length} najbardziej zanieczyszczone miasta`, dirtiestCities, 'ranking-cities-worst', rankingShare({ title: 'Najbardziej zanieczyszczone miasta', subtitle: CITIES_SUBTITLE, kind: 'najbardziej zanieczyszczone', accent: WORST, rows: cityRows(dirtiestCities) }))}
              </div>
            </div>
          )}

          <div className={styles.aqiLevelsSection}>
            <h2>Progi jakości powietrza (µg/m³)</h2>
            <table className={styles.levelsTable}>
              <thead>
                <tr>
                  <th scope="col">Poziom</th>
                  <th scope="col">PM2.5</th>
                  <th scope="col">PM10</th>
                </tr>
              </thead>
              <tbody>
                {AQI_LEVEL_LIST.map(({ level, color, label }, idx) => (
                  <tr key={level}>
                    <th scope="row">
                      <span className={styles.levelDot} style={{ backgroundColor: color }} aria-hidden="true"></span>
                      {label}
                    </th>
                    <td>{describeRange('pm25', idx)}</td>
                    <td>{describeRange('pm10', idx)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className={styles.rankingNote} style={{ marginTop: '1rem' }}>
              Progi pochodzą z{' '}
              <a href="https://airindex.eea.europa.eu/AQI/index.html" target="_blank" rel="noopener noreferrer">
                Europejskiego Indeksu Jakości Powietrza (EAQI)<span className="sr-only"> (otwiera się w nowej karcie)</span>
              </a>
              {' '}Europejskiej Agencji Środowiska, opartego na wytycznych WHO z 2021 roku. Poziom stacji wyznacza gorszy z dwóch wskaźników (PM2.5 lub PM10).
              {stats.excludedStale > 0 && ` Pominięto ${stats.excludedStale} stacji z pomiarem starszym niż ${MAX_DATA_AGE_HOURS} h.`}
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
