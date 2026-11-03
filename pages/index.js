import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts } from '../lib/blogPosts';
import BlogCard from '../components/BlogCard';
import styles from '../styles/Home.module.css';
import Footer from '../components/Footer';
import SocialMeta from '../components/SocialMeta';
import { useT } from '../lib/i18n';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home({ posts }) {
  const { t } = useT();
  return (
    <>
      <Head>
        <title>{t('SmogOFF - mapa smogowa Polski')}</title>
        <meta name="description" content={t('Monitoruj jakość powietrza w Polsce w czasie rzeczywistym')} />
        <link rel="preconnect" href="https://tiles.openfreemap.org" crossOrigin="" />
      </Head>
      <SocialMeta
        title={t('SmogOFF – mapa smogowa Polski')}
        description={t('Monitoruj jakość powietrza w Polsce w czasie rzeczywistym')}
        path="/"
        image="/api/og"
      />

      <nav aria-label={t('Skróty')}>
        <a href="#artykuly" className="skip-link">{t('Przejdź do artykułów')}</a>
        <Link href="/stacje" className="skip-link" style={{ left: '220px' }}>{t('Lista stacji (alternatywa dla mapy)')}</Link>
      </nav>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>SmogOFF</h1>
            <nav className={styles.nav} aria-label={t('Główna nawigacja')}>
              <Link href="/stats" className={styles.navLink}>{t('Statystyki')}</Link>
              <Link href="/stacje" className={styles.navLink}>{t('Miasta i stacje')}</Link>
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.mapContainer}>
            <Map posts={posts} />
          </div>

          <section className={styles.blogSection} id="artykuly" aria-labelledby="artykuly-naglowek">
            <h2 id="artykuly-naglowek" className="sr-only">{t('Artykuły o jakości powietrza')}</h2>
            <div className={styles.blogGrid}>
              {posts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps() {
  const posts = getAllPosts();
  
  return {
    props: {
      posts
    }
  };
}
