import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['components', 'pages', 'lib'];
const SKIP_DIRS = new Set(['locales']);
// t('tekst') / tr("tekst") / t(`tekst`) z literałem jako pierwszym argumentem
const CALL = /\b(?:t|tr)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) listFiles(full, out);
    } else if (full.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

// Wszystkie teksty przekazane do t() w kodzie aplikacji: klucz => lista plików, w których występuje
export function extractKeys(root = process.cwd()) {
  const keys = new Map();
  for (const rel of ROOTS) {
    for (const file of listFiles(path.join(root, rel))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(CALL)) {
        const key = match[2].replace(/\\(['"`\\])/g, '$1');
        if (!keys.has(key)) keys.set(key, []);
        keys.get(key).push(path.relative(root, file));
      }
    }
  }
  return keys;
}
