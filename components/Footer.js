import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2025 Tomasz Jasiński</p>
      <p className={styles.subtext}>
        Dane z <a href="https://ose.gov.pl" target="_blank" rel="noopener noreferrer">ESA Poland</a>
      </p>
    </footer>
  );
}