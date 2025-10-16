import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, getAllPosts } from '../../lib/blogPosts';
import styles from '../../styles/BlogPost.module.css';

export default function BlogPost({ post, allPosts }) {
  const router = useRouter();

  if (router.isFallback || !post) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${post.title} - SmogOFF`}</title>
        <meta name="description" content={post.excerpt} />
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Powrót do mapy
        </Link>

        <article className={styles.article}>
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
          <h3>Inne artykuły</h3>
          {allPosts
            .filter(p => p.slug !== post.slug)
            .map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.relatedLink}>
                {p.title}
              </Link>
            ))}
        </aside>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const posts = getAllPosts();
  const paths = posts.map(post => ({
    params: { slug: post.slug }
  }));

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
