// Generowanie grafik (PNG) ze statystyk na canvasie: bez dodatkowych bibliotek, tylko w przeglądarce.
import { AQI_LEVEL_LIST } from './aqiLevels';

const WIDTH = 1080;
const PAD = 64;
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif';
const COLORS = {
  bgTop: '#0b0e13',
  bgBottom: '#1f2937',
  text: '#f9fafb',
  muted: '#9ca3af',
  row: 'rgba(255, 255, 255, 0.06)'
};

// Bezpieczna nazwa pliku z tytułu: małe litery, bez polskich znaków i spacji
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createCanvas(height) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, height);
  return { canvas, ctx };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setFont(ctx, size, weight = 400) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

// Skraca tekst do podanej szerokości, dodając wielokropek
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

// Łamie tekst na linie o podanej szerokości (maks. maxLines, ostatnia skracana)
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
    return kept;
  }
  return lines;
}

// Nagłówek: pasek kolorów EAQI, marka, tytuł i opis. Zwraca współrzędną Y, od której można rysować treść.
function drawHeader(ctx, title, subtitle) {
  const segment = WIDTH / AQI_LEVEL_LIST.length;
  AQI_LEVEL_LIST.forEach(({ color }, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * segment, 0, segment + 1, 10);
  });

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  setFont(ctx, 30, 700);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('SmogOFF', PAD, 84);

  setFont(ctx, 58, 800);
  ctx.fillStyle = COLORS.text;
  const titleLines = wrapText(ctx, title, WIDTH - PAD * 2, 2);
  let y = 160;
  titleLines.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 68;
  });

  setFont(ctx, 26, 400);
  ctx.fillStyle = COLORS.muted;
  const subLines = wrapText(ctx, subtitle, WIDTH - PAD * 2, 3);
  y += 4;
  subLines.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 36;
  });
  return y + 28;
}

function drawFooter(ctx, height, footer) {
  setFont(ctx, 22, 400);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, footer, WIDTH - PAD * 2, 2);
  let y = height - 28 - (lines.length - 1) * 30;
  lines.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 30;
  });
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się utworzyć obrazu'))), 'image/png');
  });
}

const ROW_HEIGHT = 60;
const ROW_GAP = 8;
const SECTION_HEADER = 76;
const SECTION_GAP = 28;
const FOOTER_HEIGHT = 92;

// sections: [{ title, accent, rows: [{ rank, name, sub, color, pm25, pm10 }] }]
export async function renderRankingImage({ title, subtitle, sections, footer }) {
  // Wysokość liczymy na podstawie liczby wierszy, a nagłówek mierzymy na tymczasowym canvasie
  const probe = createCanvas(10).ctx;
  setFont(probe, 58, 800);
  const titleLines = wrapText(probe, title, WIDTH - PAD * 2, 2).length;
  setFont(probe, 26, 400);
  const subLines = wrapText(probe, subtitle, WIDTH - PAD * 2, 3).length;
  const headerHeight = 160 + (titleLines - 1) * 68 + 4 + subLines * 36 + 28 - 36 + 36;

  const bodyHeight = sections.reduce(
    (sum, s) => sum + SECTION_HEADER + s.rows.length * (ROW_HEIGHT + ROW_GAP) + SECTION_GAP,
    0
  );
  const height = Math.round(headerHeight + bodyHeight + FOOTER_HEIGHT);
  const { canvas, ctx } = createCanvas(height);
  let y = drawHeader(ctx, title, subtitle);

  for (const section of sections) {
    // Nagłówek sekcji z akcentem kolorystycznym i opisem kolumn
    ctx.fillStyle = section.accent;
    roundRect(ctx, PAD, y, 8, 40, 4);
    ctx.fill();
    setFont(ctx, 30, 800);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, section.title, 640), PAD + 24, y + 31);
    setFont(ctx, 19, 600);
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'right';
    ctx.fillText('PM2.5', WIDTH - PAD - 150, y + 30);
    ctx.fillText('PM10', WIDTH - PAD - 24, y + 30);
    y += SECTION_HEADER - 18;

    for (const row of section.rows) {
      ctx.fillStyle = COLORS.row;
      roundRect(ctx, PAD, y, WIDTH - PAD * 2, ROW_HEIGHT, 14);
      ctx.fill();

      ctx.textAlign = 'right';
      setFont(ctx, 24, 800);
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(`${row.rank}.`, PAD + 52, y + 39);

      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.arc(PAD + 82, y + ROW_HEIGHT / 2, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'left';
      const nameMax = 560;
      setFont(ctx, 26, 700);
      ctx.fillStyle = COLORS.text;
      const name = fitText(ctx, row.name, nameMax);
      const nameWidth = ctx.measureText(name).width;
      ctx.fillText(name, PAD + 108, row.sub ? y + 29 : y + 39);
      if (row.sub) {
        setFont(ctx, 18, 400);
        ctx.fillStyle = COLORS.muted;
        ctx.fillText(fitText(ctx, row.sub, Math.max(nameWidth, 220)), PAD + 108, y + 51);
      }

      ctx.textAlign = 'right';
      setFont(ctx, 28, 800);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(Number(row.pm25).toFixed(1), WIDTH - PAD - 150, y + 40);
      ctx.fillText(Number(row.pm10).toFixed(1), WIDTH - PAD - 24, y + 40);
      y += ROW_HEIGHT + ROW_GAP;
    }
    y += SECTION_GAP;
  }

  drawFooter(ctx, height, footer);
  return toBlob(canvas);
}

// stats: { total, avgPM25, avgPM10, avgTemperature, levels }
export async function renderDistributionImage({ title, subtitle, stats, footer }) {
  const rowH = 62;
  const cardsH = 150;
  const probe = createCanvas(10).ctx;
  setFont(probe, 58, 800);
  const titleLines = wrapText(probe, title, WIDTH - PAD * 2, 2).length;
  setFont(probe, 26, 400);
  const subLines = wrapText(probe, subtitle, WIDTH - PAD * 2, 3).length;
  const headerHeight = 160 + (titleLines - 1) * 68 + 4 + subLines * 36 + 28;

  const barH = 96;
  const height = Math.round(headerHeight + barH + 36 + AQI_LEVEL_LIST.length * rowH + 36 + cardsH + FOOTER_HEIGHT + 24);
  const { canvas, ctx } = createCanvas(height);
  let y = drawHeader(ctx, title, subtitle);

  // Pasek rozkładu stacji
  const barX = PAD;
  const barW = WIDTH - PAD * 2;
  ctx.save();
  roundRect(ctx, barX, y, barW, barH, 22);
  ctx.clip();
  let x = barX;
  AQI_LEVEL_LIST.forEach(({ level, color }) => {
    const count = stats.levels[level] || 0;
    const w = (count / stats.total) * barW;
    if (w <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w + 0.5, barH);
    if (w > 54) {
      setFont(ctx, 30, 800);
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.fillText(String(count), x + w / 2, y + barH / 2 + 11);
    }
    x += w;
  });
  ctx.restore();
  y += barH + 36;

  // Legenda z liczbami i procentami
  AQI_LEVEL_LIST.forEach(({ level, color, label }) => {
    const count = stats.levels[level] || 0;
    ctx.fillStyle = COLORS.row;
    roundRect(ctx, PAD, y, barW, rowH - 8, 14);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(PAD + 38, y + (rowH - 8) / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    setFont(ctx, 28, 700);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(label, PAD + 70, y + 39);
    ctx.textAlign = 'right';
    setFont(ctx, 28, 800);
    ctx.fillText(`${count}`, WIDTH - PAD - 150, y + 39);
    setFont(ctx, 26, 400);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`${((count / stats.total) * 100).toFixed(1)}%`, WIDTH - PAD - 24, y + 39);
    y += rowH;
  });
  y += 36;

  // Średnie wartości
  const cards = [
    ['Średnie PM2.5', `${stats.avgPM25} µg/m³`],
    ['Średnie PM10', `${stats.avgPM10} µg/m³`],
    ['Temperatura', `${stats.avgTemperature}°C`]
  ];
  const gap = 20;
  const cardW = (barW - gap * (cards.length - 1)) / cards.length;
  cards.forEach(([label, value], i) => {
    const cx = PAD + i * (cardW + gap);
    ctx.fillStyle = COLORS.row;
    roundRect(ctx, cx, y, cardW, cardsH - 20, 18);
    ctx.fill();
    ctx.textAlign = 'left';
    setFont(ctx, 22, 600);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(label, cx + 24, y + 44);
    setFont(ctx, 34, 800);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(fitText(ctx, value, cardW - 40), cx + 24, y + 96);
  });

  drawFooter(ctx, height, footer);
  return toBlob(canvas);
}
