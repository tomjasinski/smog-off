import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';
import SocialMeta from '../components/SocialMeta';
import { AQI_LEVEL_LIST, describeRange, paletteColor } from '../lib/aqiLevels';
import { MIN_STATIONS_FOR_CITY_PAGE } from '../lib/cities';
import { AGING_HOURS, MAX_DATA_AGE_HOURS } from '../lib/freshness';
import { WHO_24H_LIMITS } from '../lib/who';
import { useT } from '../lib/i18n';
import pageStyles from '../styles/StatsPage.module.css';

export default function AboutDataPage() {
  const { t } = useT();
  const title = t('O danych i metodologii | SmogOFF');
  const description = t('Skąd pochodzą dane SmogOFF, jak liczymy poziomy jakości powietrza i jakie są ograniczenia pomiarów.');

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <SocialMeta title={title} description={description} path="/o-danych" image="/api/og" />

      <main className={pageStyles.container}>
        <Link href="/" className={pageStyles.backLink}>{t('← Powrót do mapy')}</Link>

        <article className={pageStyles.article}>
          <h1>{t('O danych i metodologii')}</h1>
          <p>{t('Skąd pochodzą dane na SmogOFF, jak liczymy poziomy jakości powietrza i czego nie warto z nich wyczytywać.')}</p>

          <h2>{t('Źródło danych')}</h2>
          <p>
            {t('Odczyty pochodzą z publicznego API programu ESA Poland (czujniki w szkołach, ose.gov.pl). Serwer pobiera je najwyżej raz na 10 minut, a czujniki raportują średnie z około godziny, więc dane nie są natychmiastowe.')}
          </p>

          <h2>{t('Poziomy jakości powietrza (EAQI)')}</h2>
          <p>
            {t('Poziomy pochodzą z Europejskiego Indeksu Jakości Powietrza (EAQI) Europejskiej Agencji Środowiska, opartego na wytycznych WHO z 2021 roku. Poziom stacji wyznacza gorszy z dwóch wskaźników (PM2.5 lub PM10).')}
          </p>
          <table className={pageStyles.levelsTable}>
            <caption className="sr-only">{t('Progi jakości powietrza (µg/m³)')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Poziom')}</th>
                <th scope="col">PM2.5</th>
                <th scope="col">PM10</th>
              </tr>
            </thead>
            <tbody>
              {AQI_LEVEL_LIST.map(({ level, color, label }, idx) => (
                <tr key={level}>
                  <th scope="row">
                    <span className={pageStyles.levelDot} style={{ backgroundColor: paletteColor(color) }} aria-hidden="true"></span>
                    {t(label)}
                  </th>
                  <td>{describeRange('pm25', idx)}</td>
                  <td>{describeRange('pm10', idx)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>{t('Porównanie z normami WHO')}</h2>
          <p>
            {t('W szczegółach stacji pokazujemy, ile razy stężenie przekracza dobowe stężenia graniczne zalecane przez WHO (2021): PM2.5 {pm25} µg/m³, PM10 {pm10} µg/m³. To zalecenia zdrowotne, a nie prawnie obowiązujące limity, które w Unii Europejskiej są mniej restrykcyjne.', WHO_24H_LIMITS)}
          </p>

          <h2>{t('Miasta i mediany')}</h2>
          <p>
            {t('Podstrona miasta powstaje, gdy ma co najmniej {min} stacji. Pokazane wartości to mediany odczytów, więc pojedynczy błędny czujnik nie zniekształca wyniku. Odczyty poniżej 1 µg/m³ traktujemy jako podejrzane i pomijamy w rankingach.', { min: MIN_STATIONS_FOR_CITY_PAGE })}
          </p>

          <h2>{t('Świeżość pomiarów')}</h2>
          <p>
            {t('Pomiary starsze niż {max} godz. nie są pokazywane. Pomiar, który ma co najmniej {aging} godz., oznaczamy ostrzeżeniem, bo może nie odzwierciedlać obecnej sytuacji.', { max: MAX_DATA_AGE_HOURS, aging: AGING_HOURS })}
          </p>

          <h2>{t('Ograniczenia')}</h2>
          <ul>
            <li>{t('Czujniki są niskokosztowe (optyczne). Przy dużej wilgotności powietrza potrafią zawyżać wynik PM2.5, a ich dokładność jest mniejsza niż urzędowych stacji.')}</li>
            <li>{t('Stacja mierzy jeden punkt. Rozmyte pole wokół niej to tylko orientacyjny zasięg (ok. 1,5 km), a z dala od stacji dane są mniej pewne.')}</li>
            <li>{t('Czujniki bywają chwilowo wyłączone, więc nie każda miejscowość jest na mapie przez cały czas.')}</li>
            <li>{t('SmogOFF nie zastępuje urzędowych pomiarów ani porady lekarza. Nie używaj go do decyzji zdrowotnych.')}</li>
          </ul>

          <h2>{t('Prywatność')}</h2>
          <p>
            {t('Ustawienia, ulubione stacje i ostatni widok mapy zapisujemy wyłącznie w Twojej przeglądarce. Nie zakładamy kont i nie wysyłamy tych informacji na serwer.')}
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
