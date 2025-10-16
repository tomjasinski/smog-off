import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

export function getAllPosts() {
  // Sprawdź czy folder istnieje
  if (!fs.existsSync(postsDirectory)) {
    console.warn('Folder content/posts nie istnieje, zwracam pustą tablicę');
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Bez tytułu',
        excerpt: data.excerpt || '',
        image: data.image || '',
        content: content
      };
    });

  return allPostsData;
}

export function getBlogPost(slug) {
  const posts = getAllPosts();
  return posts.find(post => post.slug === slug);
}
