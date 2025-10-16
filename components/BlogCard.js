import Link from 'next/link';
import styles from '../styles/BlogCard.module.css';

export default function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.cardContent}>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <span className={styles.readMore}>Czytaj więcej →</span>
      </div>
    </Link>
  );
}
