import Link from 'next/link';
import { pickPostsForLevel, contextHeading } from '../lib/contextualPosts';
import styles from '../styles/StationArticles.module.css';

export default function StationArticles({ level, posts }) {
  const picked = pickPostsForLevel(level, posts);
  if (picked.length === 0) return null;

  return (
    <section className={styles.articles} aria-labelledby="station-articles-title">
      <h3 id="station-articles-title">{contextHeading(level)}</h3>
      <ul>
        {picked.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
