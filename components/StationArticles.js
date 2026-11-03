import Link from 'next/link';
import { pickPostsForLevel, contextHeading } from '../lib/contextualPosts';
import styles from '../styles/StationArticles.module.css';
import { useT } from '../lib/i18n';

export default function StationArticles({ level, posts }) {
  const { t } = useT();
  const picked = pickPostsForLevel(level, posts);
  if (picked.length === 0) return null;

  return (
    <section className={styles.articles} aria-labelledby="station-articles-title">
      <h3 id="station-articles-title">{t(contextHeading(level))}</h3>
      <ul>
        {picked.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} lang="pl">{post.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
