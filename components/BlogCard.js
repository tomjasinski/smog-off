import Link from 'next/link';
import styles from '../styles/BlogCard.module.css';
import { useT } from '../lib/i18n';

export default function BlogCard({ post }) {
  const { t } = useT();
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.cardContent}>
        <h3 lang="pl">{post.title}</h3>
        <p lang="pl">{post.excerpt}</p>
        <span className={styles.readMore}>{t('Czytaj więcej →')}</span>
      </div>
    </Link>
  );
}
