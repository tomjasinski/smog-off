import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getReadableTextColor } from '../lib/aqiLevels';
import { cityPageSlugs } from '../lib/cities';
import CityLink from '../components/CityLink';
import styles from '../styles/StationsPage.module.css';

const PAGE_SIZE = 50;

const SORTS = {
  'pm25-asc': { label: 'PM2.5: od najczystszych', compare: (a, b) => a.data.pm25 - b.data.pm25 },
  'pm25-desc': { label: 'PM2.5: od najbardziej zanieczyszczonych', compare: (a, b) => b.data.pm25 - a.data.pm25 },
  'pm10-asc': { label: 'PM10: od najczystszych', compare: (a, b) => a.data.pm10 - b.data.pm10 },
  'pm10-desc': { label: 'PM10: od najbardziej zanieczyszczonych', compare: (a, b) => b.data.pm10 - a.data.pm10 },
  name: { label: 'Nazwa A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pl') }
};

// Porównanie bez wielkości liter i polskich znaków ("lodz" znajdzie "ŁÓDŹ")
const normalize = (text) =>
  text
    .toLocaleLowerCase('pl')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('pm25-desc');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch('/api/air-quality')
      .then(res => res.json())
      .then(result => {
        setStations(result.data || []);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return stations
      .filter(s => !q || normalize(`${s.city} ${s.name} ${s.street}`).includes(q))
      .sort(SORTS[sort].compare);
  }, [stations, query, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, sort]);

  const citySlugs = useMemo(() => cityPageSlugs(stations), [stations]);

  const shown = filtered.slice(0, visible);

  return (
    <>
      <Head>
        <title>Lista stacji pomiarowych - SmogOFF</title>
        <meta name="description" content="Wszystkie stacje pomiarowe jakości powietrza w formie tabeli z wyszukiwaniem po miejscowości, nazwie lub ulicy." />
      </Head>

      <main className={styles.container}>
        <Link href="/" className={styles.backLink}>← Powrót do mapy</Link>
        {' · '}
        <Link href="/stats" className={styles.backLink}>Statystyki</Link>

        <article className={styles.article}>
          <h1>Lista stacji pomiarowych</h1>
          <p className={styles.intro}>
            Te same dane co na mapie, w formie tabeli. Wpisz miejscowość, nazwę szkoły lub ulicę, żeby zawęzić listę.
          </p>

          <div className={styles.controls}>
            <div className={styles.field}>
              <label htmlFor="station-search">Szukaj (miejscowość, nazwa, ulica)</label>
              <input
                id="station-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                placeholder="np. Poznań"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="station-sort">Sortuj</label>
              <select id="station-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {status === 'loading' && <p role="status">Ładowanie stacji…</p>}
          {status === 'error' && <p role="alert">Nie udało się załadować stacji. Spróbuj ponownie później.</p>}

          {status === 'ready' && (
            <>
              <p className={styles.count} role="status" aria-live="polite">
                {filtered.length === 0
                  ? 'Brak stacji pasujących do wyszukiwania.'
                  : `Znaleziono stacji: ${filtered.length}. Wyświetlono: ${shown.length}.`}
              </p>

              {filtered.length > 0 && (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption className="sr-only">
                      Stacje pomiarowe z odczytami PM2.5 i PM10 w µg/m³ oraz oceną jakości powietrza
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Stacja</th>
                        <th scope="col">Miejscowość</th>
                        <th scope="col" className={styles.num}>PM2.5</th>
                        <th scope="col" className={styles.num}>PM10</th>
                        <th scope="col">Jakość</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map(s => (
                        <tr key={s.id}>
                          <th scope="row" className={styles.stationName}>
                            {s.name}
                            {s.street && <span className={styles.street}>{s.street}</span>}
                          </th>
                          <td><CityLink name={s.city} slugs={citySlugs} className={styles.cityLink} /></td>
                          <td className={styles.num}>{s.data.pm25}</td>
                          <td className={styles.num}>{s.data.pm10}</td>
                          <td>
                            <span
                              className={styles.badge}
                              style={{ backgroundColor: s.aqi.color, color: getReadableTextColor(s.aqi.color) }}
                            >
                              {s.aqi.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {shown.length < filtered.length && (
                <button type="button" className={styles.moreButton} onClick={() => setVisible(v => v + PAGE_SIZE)}>
                  Pokaż więcej ({filtered.length - shown.length} pozostało)
                </button>
              )}
            </>
          )}
        </article>
      </main>
    </>
  );
}
