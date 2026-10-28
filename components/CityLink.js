import Link from 'next/link';
import { citySlug } from '../lib/cities';

// Nazwa miejscowości jako link do podstrony miasta, o ile taka podstrona istnieje (slugs: Set ze slugami miast)
export default function CityLink({ name, slugs, className }) {
  const slug = citySlug(name || '');
  if (!slug || !slugs?.has(slug)) return name;
  return <Link href={`/miasto/${slug}`} className={className}>{name}</Link>;
}
