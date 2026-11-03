import { useId } from 'react';
import { useT } from '../lib/i18n';
import styles from '../styles/SortSelect.module.css';

// Lista wyboru sposobu sortowania. options: [{ value, label }] (label po polsku, tłumaczony tutaj)
export default function SortSelect({ value, onChange, options }) {
  const { t } = useT();
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{t('Sortuj')}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{t(option.label)}</option>
        ))}
      </select>
    </div>
  );
}
