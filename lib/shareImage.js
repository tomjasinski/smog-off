// Generowanie grafik (PNG) ze statystyk na canvasie: bez dodatkowych bibliotek, tylko w przeglądarce.
// Format: 1080 x 1920 (pionowy, jak ekran telefonu / relacja), z dużą czcionką, żeby treść była czytelna na małym ekranie.
import { AQI_LEVEL_LIST, getReadableTextColor } from './aqiLevels';
import { SITE_HOST } from './site';

export { slugify } from './slug';

const WIDTH = 1080;
const HEIGHT = 1920;
const PAD = 56;
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif';
const COLORS = {
  bgTop: '#0b0e13',
  bgBottom: '#1f2937',
  text: '#f9fafb',
  muted: '#9ca3af',
  row: 'rgba(255, 255, 255, 0.06)'
};

const CTA_HEIGHT = 84;
const FOOTER_HEIGHT = 84;
const CTA_GAP = 28;
const CTA_TOP = HEIGHT - FOOTER_HEIGHT - CTA_HEIGHT;

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
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
    ctx.fillRect(i * segment, 0, segment + 1, 14);
  });

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  setFont(ctx, 34, 700);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('SmogOFF', PAD, 100);

  ctx.fillStyle = COLORS.text;
  let titleSize = 78;
  let titleLines;
  for (const size of [78, 70, 62, 56]) {
    titleSize = size;
    setFont(ctx, size, 800);
    const all = wrapText(ctx, title, WIDTH - PAD * 2, 10);
    titleLines = all;
    if (all.length <= 2) break;
  }
  titleLines = titleLines.slice(0, 2);
  setFont(ctx, titleSize, 800);
  const titleLineH = Math.round(titleSize * 1.15);
  let y = 200;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, PAD, y);
    if (i < titleLines.length - 1) y += titleLineH;
  });

  setFont(ctx, 30, 400);
  ctx.fillStyle = COLORS.muted;
  const subLines = wrapText(ctx, subtitle, WIDTH - PAD * 2, 2);
  y += 56;
  subLines.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 42;
  });
  return y + 22;
}

// Wyraźny, ale zwarty baner z adresem strony oraz linia ze źródłem danych
function drawFooter(ctx, footer) {
  const x = PAD;
  const w = WIDTH - PAD * 2;
  const y = CTA_TOP;
  const midY = y + (CTA_HEIGHT - 6) / 2;

  ctx.save();
  roundRect(ctx, x, y, w, CTA_HEIGHT, 16);
  ctx.clip();
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(x, y, w, CTA_HEIGHT);
  const segment = w / AQI_LEVEL_LIST.length;
  AQI_LEVEL_LIST.forEach(({ color }, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + i * segment, y + CTA_HEIGHT - 6, segment + 1, 6);
  });
  ctx.restore();

  ctx.textAlign = 'left';
  setFont(ctx, 18, 600);
  ctx.fillStyle = '#4b5563';
  ctx.fillText('Sprawdź jakość powietrza w swojej okolicy', x + 24, y + 27);
  setFont(ctx, 40, 800);
  ctx.fillStyle = '#111827';
  ctx.fillText(SITE_HOST, x + 24, y + 64);

  // Okrągła strzałka po prawej stronie banera
  const ax = x + w - 48;
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(ax, midY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(ax - 9, midY);
  ctx.lineTo(ax + 9, midY);
  ctx.moveTo(ax + 2, midY - 7);
  ctx.lineTo(ax + 9, midY);
  ctx.lineTo(ax + 2, midY + 7);
  ctx.stroke();

  setFont(ctx, 24, 400);
  ctx.fillStyle = COLORS.muted;
  const lines = wrapText(ctx, footer, WIDTH - PAD * 2, 2);
  let ty = HEIGHT - 30 - (lines.length - 1) * 30;
  lines.forEach((line) => {
    ctx.fillText(line, PAD, ty);
    ty += 30;
  });
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się utworzyć obrazu'))), 'image/png');
  });
}

const SECTION_HEADER = 96;
const ROW_GAP = 14;
const MAX_ROW_PITCH = 140;

// Kolumny wartości są ściśnięte przy prawej krawędzi, żeby nazwa miała więcej miejsca
const X_PM10 = WIDTH - PAD - 20;
const X_PM25 = X_PM10 - 118;
const NAME_X = PAD + 106;
const NAME_MAX = X_PM25 - 92 - NAME_X;

// sections: [{ title, accent, rows: [{ rank, name, sub, color, label, pm25, pm10 }] }]
export async function renderRankingImage({ title, subtitle, sections, footer }) {
  const { canvas, ctx } = createCanvas();
  let y = drawHeader(ctx, title, subtitle);

  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);
  const available = CTA_TOP - CTA_GAP - y - sections.length * SECTION_HEADER;
  const pitch = Math.min(Math.floor(available / totalRows), MAX_ROW_PITCH);
  const rowH = pitch - ROW_GAP;

  for (const section of sections) {
    ctx.fillStyle = section.accent;
    roundRect(ctx, PAD, y + 8, 10, 52, 5);
    ctx.fill();
    setFont(ctx, 40, 800);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, section.title, X_PM25 - 140 - PAD), PAD + 30, y + 49);
    setFont(ctx, 22, 700);
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'right';
    ctx.fillText('PM2.5', X_PM25, y + 46);
    ctx.fillText('PM10', X_PM10, y + 46);
    y += SECTION_HEADER;

    for (const row of section.rows) {
      // Tło wiersza lekko zabarwione kolorem poziomu i wyraźny pasek po lewej
      ctx.fillStyle = COLORS.row;
      roundRect(ctx, PAD, y, WIDTH - PAD * 2, rowH, 18);
      ctx.fill();
      ctx.fillStyle = hexToRgba(row.color, 0.2);
      roundRect(ctx, PAD, y, WIDTH - PAD * 2, rowH, 18);
      ctx.fill();
      ctx.fillStyle = row.color;
      roundRect(ctx, PAD, y, 12, rowH, 6);
      ctx.fill();

      // Numer w kółku w kolorze poziomu
      const cx = PAD + 56;
      const cy = y + rowH / 2;
      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'center';
      setFont(ctx, row.rank >= 10 ? 26 : 30, 800);
      ctx.fillStyle = getReadableTextColor(row.color);
      ctx.fillText(String(row.rank), cx, cy + 10);

      // Nazwa (do dwóch linii) i miejscowość
      ctx.textAlign = 'left';
      setFont(ctx, 30, 700);
      const nameLines = wrapText(ctx, row.name, NAME_MAX, 2);
      const blockH = nameLines.length * 36 + (row.sub ? 28 : 0);
      const top = y + (rowH - blockH) / 2;
      ctx.fillStyle = COLORS.text;
      nameLines.forEach((line, i) => ctx.fillText(line, NAME_X, top + 27 + i * 36));
      if (row.sub) {
        setFont(ctx, 22, 400);
        ctx.fillStyle = COLORS.muted;
        ctx.fillText(fitText(ctx, row.sub, NAME_MAX), NAME_X, top + nameLines.length * 36 + 22);
      }

      // Wartości PM tuż obok siebie, a pod nimi etykieta poziomu jakości
      ctx.textAlign = 'right';
      setFont(ctx, 36, 800);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(Number(row.pm25).toFixed(1), X_PM25, y + 50);
      ctx.fillText(Number(row.pm10).toFixed(1), X_PM10, y + 50);
      if (row.label) {
        setFont(ctx, 20, 800);
        const w = ctx.measureText(row.label).width + 30;
        const px = X_PM10 + 8 - w;
        const py = y + rowH - 44;
        ctx.fillStyle = row.color;
        roundRect(ctx, px, py, w, 32, 16);
        ctx.fill();
        ctx.fillStyle = getReadableTextColor(row.color);
        ctx.textAlign = 'center';
        ctx.fillText(row.label, px + w / 2, py + 23);
      }
      y += rowH + ROW_GAP;
    }
  }

  drawFooter(ctx, footer);
  return toBlob(canvas);
}

// stats: { total, avgPM25, avgPM10, avgTemperature, levels }
export async function renderDistributionImage({ title, subtitle, stats, footer }) {
  const { canvas, ctx } = createCanvas();
  let y = drawHeader(ctx, title, subtitle);

  // Pasek rozkładu stacji
  const barX = PAD;
  const barW = WIDTH - PAD * 2;
  const barH = 200;
  ctx.save();
  roundRect(ctx, barX, y, barW, barH, 32);
  ctx.clip();
  let x = barX;
  AQI_LEVEL_LIST.forEach(({ level, color }) => {
    const count = stats.levels[level] || 0;
    const w = (count / stats.total) * barW;
    if (w <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w + 0.5, barH);
    // Liczby tylko tam, gdzie mieszczą się w segmencie z zapasem (wąskie by się nakładały)
    setFont(ctx, 56, 800);
    if (ctx.measureText(String(count)).width + 40 <= w) {
      ctx.fillStyle = getReadableTextColor(color);
      ctx.textAlign = 'center';
      ctx.fillText(String(count), x + w / 2, y + barH / 2 + 20);
    }
    x += w;
  });
  ctx.restore();
  y += barH + 44;

  // Legenda: kolorowe wiersze z liczbami i procentami
  const rowH = 112;
  const pitch = 128;
  AQI_LEVEL_LIST.forEach(({ level, color, label }) => {
    const count = stats.levels[level] || 0;
    ctx.fillStyle = COLORS.row;
    roundRect(ctx, PAD, y, barW, rowH, 20);
    ctx.fill();
    ctx.fillStyle = hexToRgba(color, 0.2);
    roundRect(ctx, PAD, y, barW, rowH, 20);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, PAD, y, 14, rowH, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(PAD + 66, y + rowH / 2, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    setFont(ctx, 44, 800);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(label, PAD + 116, y + rowH / 2 + 15);
    ctx.textAlign = 'right';
    setFont(ctx, 52, 800);
    ctx.fillText(String(count), WIDTH - PAD - 190, y + rowH / 2 + 18);
    setFont(ctx, 38, 600);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`${((count / stats.total) * 100).toFixed(1)}%`, WIDTH - PAD - 28, y + rowH / 2 + 14);
    y += pitch;
  });
  y += 8;

  // Średnie wartości
  const cards = [
    ['Średnie PM2.5', `${stats.avgPM25} µg/m³`],
    ['Średnie PM10', `${stats.avgPM10} µg/m³`],
    ['Temperatura', `${stats.avgTemperature}°C`]
  ];
  const gap = 20;
  const cardW = (barW - gap * (cards.length - 1)) / cards.length;
  const cardH = Math.min(220, CTA_TOP - CTA_GAP - y);
  cards.forEach(([label, value], i) => {
    const cx = PAD + i * (cardW + gap);
    ctx.fillStyle = COLORS.row;
    roundRect(ctx, cx, y, cardW, cardH, 22);
    ctx.fill();
    ctx.textAlign = 'left';
    setFont(ctx, 26, 600);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(label, cx + 26, y + 62);
    setFont(ctx, 46, 800);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(fitText(ctx, value, cardW - 44), cx + 26, y + 138);
  });

  drawFooter(ctx, footer);
  return toBlob(canvas);
}
