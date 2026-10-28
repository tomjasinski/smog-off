import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styles from '../styles/BlogSheet.module.css';

const ROTATE_MS = 6000;
const DRAG_THRESHOLD_PX = 30;

// Zwinięty: pasek z rotującym tytułem artykułu. Rozwinięty (tap, przeciągnięcie w górę): lista artykułów.
export default function BlogSheet({ posts }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef({ startY: null, dragged: false });

  const ordered = useMemo(() => [...posts].sort(() => Math.random() - 0.5), [posts]);

  useEffect(() => {
    if (open || paused || ordered.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ordered.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [open, paused, ordered.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (ordered.length === 0) return null;

  const onPointerDown = (e) => {
    // Bez przechwycenia wskaźnika myszka poza przyciskiem nie wyśle pointerup do tego elementu
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startY: e.clientY, dragged: false };
  };

  const onPointerUp = (e) => {
    const { startY } = dragRef.current;
    if (startY === null) return;
    const dy = e.clientY - startY;
    if (dy <= -DRAG_THRESHOLD_PX) {
      dragRef.current.dragged = true;
      setOpen(true);
    } else if (dy >= DRAG_THRESHOLD_PX) {
      dragRef.current.dragged = true;
      setOpen(false);
    }
    dragRef.current.startY = null;
  };

  const onClick = () => {
    if (dragRef.current.dragged) {
      dragRef.current.dragged = false;
      return;
    }
    setOpen((v) => !v);
  };

  const current = ordered[index % ordered.length];

  return (
    <section
      className={`${styles.sheet} ${open ? styles.open : ''}`}
      aria-label="Wybrane artykuły"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls="blog-sheet-list"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current.startY = null; }}
      >
        <span className={styles.handle} aria-hidden="true" />
        <span className={styles.row}>
          <span key={open ? 'title' : current.slug} className={styles.current}>
            {open ? 'Artykuły o jakości powietrza' : current.title}
          </span>
          <span className={styles.count} aria-hidden="true">{ordered.length}</span>
          <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 15l6-6 6 6" />
          </svg>
        </span>
      </button>

      {open && (
        <ul id="blog-sheet-list" className={styles.list}>
          {ordered.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={styles.item}>
                <span className={styles.itemTitle}>{post.title}</span>
                {post.excerpt && post.excerpt !== post.title && (
                  <span className={styles.itemExcerpt}>{post.excerpt}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
