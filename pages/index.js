import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts } from '../lib/blogPosts';
import BlogCard from '../components/BlogCard';
import styles from '../styles/Home.module.css';
import Footer from '../components/Footer';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home({ posts }) {
  return (
    <>
      <Head>
        <title>SmogOFF - mapa smogowa Polski</title>
        <meta name="description" content="Monitoruj jakość powietrza w Polsce w czasie rzeczywistym" />
        <link rel="preconnect" href="https://tiles.openfreemap.org" crossOrigin="" />
      </Head>

      <nav aria-label="Skróty">
        <a href="#artykuly" className="skip-link">Przejdź do artykułów</a>
        <Link href="/stacje" className="skip-link" style={{ left: '220px' }}>Lista stacji (alternatywa dla mapy)</Link>
      </nav>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>mapasmogu.pl</h1>
            <nav className={styles.nav} aria-label="Główna nawigacja">
              <Link href="/stats" className={styles.navLink}>Statystyki</Link>
              <Link href="/stacje" className={styles.navLink}>Miasta i stacje</Link>
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.mapContainer}>
            <Map posts={posts} />
          </div>

          <section className={styles.blogSection} id="artykuly" aria-labelledby="artykuly-naglowek">
            <h2 id="artykuly-naglowek" className="sr-only">Artykuły o jakości powietrza</h2>
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
