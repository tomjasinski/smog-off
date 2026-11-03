import Head from 'next/head';
import { SITE_URL } from '../lib/site';

// Znaczniki podglądu linku w komunikatorach (Open Graph i Twitter Card). image: ścieżka obrazu, np. /api/og?city=poznan
export default function SocialMeta({ title, description, url, image }) {
  const imageUrl = `${SITE_URL}${image}`;
  return (
    <Head>
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SmogOFF" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
}
