import dynamic from 'next/dynamic';
import Head from 'next/head';
import { getAllPosts } from '../lib/blogPosts';
import BlogCard from '../components/BlogCard';
import styles from '../styles/Home.module.css';
import Loading from '../components/Loading';
import Footer from '../components/Footer';

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <Loading />
});

export default function Home({ posts }) {
  return (
    <>
      <Head>
        <title>SmogOFF - mapa smogowa Polski</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Monitoruj jakość powietrza w Polsce w czasie rzeczywistym" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>SmogOFF</h1>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{backgroundColor: '#4ade80'}}></span>
                Dobra
              </span>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{backgroundColor: '#fbbf24'}}></span>
                Średnia
              </span>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{backgroundColor: '#fb923c'}}></span>
                Niezdrowa
              </span>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{backgroundColor: '#ef4444'}}></span>
                Zła
              </span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.mapContainer}>
            <Map posts={posts} />
          </div>

          <section className={styles.blogSection}>
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
