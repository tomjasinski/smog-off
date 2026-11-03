import { useEffect, useState } from 'react';
import { useT, intlLocale } from '../lib/i18n';
import { whoSummary } from '../lib/who';
import { AGING_HOURS, measurementAgeMinutes } from '../lib/freshness';
import styles from '../styles/StationInsights.module.css';

// Bieżąca interpretacja odczytu zwykłym tekstem: ile razy stężenie przekracza dobową normę WHO
export function WhoNote({ pm25, pm10 }) {
  const { t, locale } = useT();
  const summary = whoSummary(pm25, pm10);
  const fmt = (n) => n.toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 });

  const sentence = (name, entry) =>
    entry.exceeds
      ? t('Stężenie {name} jest teraz {ratio}× wyższe niż dobowa norma WHO ({limit} µg/m³).', { name, ratio: fmt(entry.ratio), limit: entry.limit })
      : t('Stężenie {name} mieści się w dobowej normie WHO ({limit} µg/m³).', { name, limit: entry.limit });

  return (
    <p className={styles.note}>
      {sentence('PM2.5', summary.pm25)} {sentence('PM10', summary.pm10)}
    </p>
  );
}

// Uwaga, gdy pomiar ma co najmniej AGING_HOURS godzin. Wiek liczymy po stronie przeglądarki (strona może być z cache).
export function StaleNote({ timestamp }) {
  const { t } = useT();
  const [age, setAge] = useState(null);

  useEffect(() => {
    setAge(measurementAgeMinutes(timestamp));
  }, [timestamp]);

  if (age === null || age < AGING_HOURS * 60) return null;
  const hours = Math.floor(age / 60);
  const minutes = age % 60;

  return (
    <p className={styles.warning} role="note">
      ⚠️ {t('Pomiar sprzed {hours} godz. {minutes} min. Może nie odzwierciedlać obecnej sytuacji.', { hours, minutes })}
    </p>
  );
}
