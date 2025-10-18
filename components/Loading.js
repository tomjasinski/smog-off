import styles from '../styles/Loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.airQualityLoader}>
        <div className={styles.particle} style={{animationDelay: '0s'}}></div>
        <div className={styles.particle} style={{animationDelay: '0.2s'}}></div>
        <div className={styles.particle} style={{animationDelay: '0.4s'}}></div>
        <div className={styles.particle} style={{animationDelay: '0.6s'}}></div>
        <div className={styles.particle} style={{animationDelay: '0.8s'}}></div>
      </div>
      <div className={styles.loadingText}>
        <h3>🌡️ SmogOFF</h3>
        <p>Ładowanie danych o jakości powietrza...</p>
      </div>
    </div>
  );
}
