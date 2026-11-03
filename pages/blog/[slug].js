import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, getAllPosts } from '../../lib/blogPosts';
import styles from '../../styles/BlogPost.module.css';
import { useT } from '../../lib/i18n';

export default function BlogPost({ post, allPosts }) {
  const { t, locale } = useT();
  const router = useRouter();

  if (router.isFallback || !post) {
    return <div className={styles.loading}>{t('Ładowanie...')}</div>;
  }

  return (
    <>
      <Head>
        <title>{`${post.title} - SmogOFF`}</title>
        <meta name="description" content={post.excerpt} />
        {locale !== 'pl' && <meta name="robots" content="noindex" />}
      </Head>

      <main className={styles.container}>
        <Link href="/" className={styles.backLink}>
          {t('← Powrót do mapy')}
        </Link>

        {locale !== 'pl' && (
          <p className={styles.languageNote} role="note">
            {t('Ten artykuł jest dostępny tylko po polsku.')}
          </p>
        )}

        <article className={styles.article} lang="pl">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({node, ...props}) => {
                return (
                  <span className={styles.imageWrapper}>
                    <Image
                      src={props.src || ''}
                      alt={props.alt || ''}
                      width={800}
                      height={600}
                      className={styles.blogImage}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </span>
                );
              },
              a: ({node, ...props}) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              )
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        <aside className={styles.relatedPosts}>
          <h3>{t('Inne artykuły')}</h3>
          {allPosts
            .filter(p => p.slug !== post.slug)
            .map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.relatedLink}>
                <span lang="pl">{p.title}</span>
              </Link>
            ))}
        </aside>
      </main>
    </>
  );
}

export async function getStaticPaths({ locales }) {
  const posts = getAllPosts();
  const paths = locales.flatMap(locale => posts.map(post => ({
    params: { slug: post.slug },
    locale
  })));

  return { 
    paths, 
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const post = getBlogPost(params.slug);
  const allPosts = getAllPosts();
  
  if (!post) {
    return { notFound: true };
  }

  return { 
    props: { 
      post,
      allPosts 
    }
  };
}
