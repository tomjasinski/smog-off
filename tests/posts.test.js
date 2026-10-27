import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const dir = path.join(process.cwd(), 'content', 'posts');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

describe('wpisy na blogu', () => {
  it('istnieją', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s ma tytuł, zajawkę i treść', (file) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    expect(String(data.title || '').trim()).not.toBe('');
    expect(String(data.excerpt || '').trim()).not.toBe('');
    expect(content.trim().length).toBeGreaterThan(200);
  });

  it.each(files)('%s ma nazwę pliku nadającą się na adres (slug)', (file) => {
    expect(file).toMatch(/^[a-z0-9-]+\.md$/);
  });
});
