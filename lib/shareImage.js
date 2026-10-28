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

// Pierwsza linia tytułu zaczyna się tuż pod paskiem kolorów (nazwy strony nie ma w nagłówku: jest w banerze)
const HEADER_TITLE_Y = 118;
const FOOTER_HEIGHT = 84;
const CTA_GAP = 28;
const BOTTOM = HEIGHT - FOOTER_HEIGHT; // dolna krawędź banera
export const BANNER_MIN = 132;
export const BANNER_MAX = 240;
// Nazwa strony ma być co najmniej tak duża jak etykiety poziomów jakości w legendzie (44 px)
export const MIN_SITE_NAME_SIZE = 48;
const MAX_SITE_NAME_SIZE = 72;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Baner wypełnia wolne miejsce pod tabelą/treścią (od BANNER_MIN do BANNER_MAX), a rozmiar napisów rośnie razem z nim
export function computeBannerLayout(contentEnd) {
  const height = clamp(BOTTOM - contentEnd - 16, BANNER_MIN, BANNER_MAX);
  const siteNameSize = clamp(Math.round(height * 0.4), MIN_SITE_NAME_SIZE, MAX_SITE_NAME_SIZE);
  const labelSize = clamp(Math.round(siteNameSize * 0.45), 22, 32);
  return { top: BOTTOM - height, height, siteNameSize, labelSize };
}

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
  let y = HEADER_TITLE_Y;
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

// Baner z adresem strony (wypełnia wolne miejsce pod treścią) oraz linia ze źródłem danych
function drawFooter(ctx, footer, contentEnd) {
  const { top: y, height: h, siteNameSize, labelSize } = computeBannerLayout(contentEnd);
  const x = PAD;
  const w = WIDTH - PAD * 2;
  const stripe = 8;
  const midY = y + (h - stripe) / 2;

  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.clip();
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(x, y, w, h);
  const segment = w / AQI_LEVEL_LIST.length;
  AQI_LEVEL_LIST.forEach(({ color }, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + i * segment, y + h - stripe, segment + 1, stripe);
  });
  ctx.restore();

  ctx.textAlign = 'left';
  setFont(ctx, labelSize, 600);
  ctx.fillStyle = '#4b5563';
  ctx.fillText('Sprawdź jakość powietrza w swojej okolicy', x + 32, y + h * 0.33);
  setFont(ctx, siteNameSize, 800);
  ctx.fillStyle = '#111827';
  ctx.fillText(SITE_HOST, x + 32, y + h * 0.76);

  // Okrągła strzałka po prawej stronie banera
  const r = Math.round(h * 0.17);
  const ax = x + w - r - 32;
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(ax, midY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, r / 6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const k = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(ax - k, midY);
  ctx.lineTo(ax + k, midY);
  ctx.moveTo(ax + k * 0.1, midY - k * 0.75);
  ctx.lineTo(ax + k, midY);
  ctx.lineTo(ax + k * 0.1, midY + k * 0.75);
  ctx.stroke();

  setFont(ctx, 24, 400);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'left';
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
// Sam wiersz z opisami kolumn (gdy sekcja nie ma tytułu)
const COLUMNS_HEADER = 40;
const ROW_GAP = 14;
const MAX_ROW_PITCH = 140;
// Wiersz musi mieć miejsce na nazwę (2 linie), ulicę, wartości PM i etykietę poziomu bez nachodzenia
const MIN_ROW_PITCH = 120;

// Kolumny wartości są ściśnięte przy prawej krawędzi, żeby nazwa miała więcej miejsca
const X_PM10 = WIDTH - PAD - 20;
const X_PM25 = X_PM10 - 118;
const NAME_X = PAD + 106;
const NAME_MAX = X_PM25 - 92 - NAME_X;

function drawSectionHeader(ctx, title, accent, y) {
  if (title) {
    ctx.fillStyle = accent;
    roundRect(ctx, PAD, y + 8, 10, 52, 5);
    ctx.fill();
    setFont(ctx, 40, 800);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, title, X_PM25 - 140 - PAD), PAD + 30, y + 49);
  }
  const labelY = y + (title ? 46 : 22);
  setFont(ctx, 22, 700);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'right';
  ctx.fillText('PM2.5', X_PM25, labelY);
  ctx.fillText('PM10', X_PM10, labelY);
  return title ? SECTION_HEADER : COLUMNS_HEADER;
}

// Wiersz stacji/miasta: tło zabarwione kolorem poziomu, numer w kółku, nazwa (do 2 linii), wartości PM i etykieta poziomu
function drawStationRow(ctx, row, y, rowH) {
  ctx.fillStyle = COLORS.row;
  roundRect(ctx, PAD, y, WIDTH - PAD * 2, rowH, 18);
  ctx.fill();
  ctx.fillStyle = hexToRgba(row.color, 0.2);
  roundRect(ctx, PAD, y, WIDTH - PAD * 2, rowH, 18);
  ctx.fill();
  ctx.fillStyle = row.color;
  roundRect(ctx, PAD, y, 12, rowH, 6);
  ctx.fill();

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
}

const NOTE_H = 44;

// Ile wierszy (od najgorszego) mieści się od pozycji startY i jaka ma być ich wysokość; reszta trafia do dopisku
export function computeRowFit(startY, rowCount, maxRows = Infinity) {
  const space = BOTTOM - BANNER_MIN - CTA_GAP - startY;
  let shown = Math.min(rowCount, Math.max(1, Math.floor(space / MIN_ROW_PITCH)));
  if (shown < rowCount) shown = Math.min(rowCount, Math.max(1, Math.floor((space - NOTE_H) / MIN_ROW_PITCH)));
  shown = Math.min(shown, maxRows);
  const hidden = rowCount - shown;
  const available = space - (hidden > 0 ? NOTE_H : 0);
  const pitch = Math.min(Math.floor(available / shown), MAX_ROW_PITCH);
  return { shown, hidden, rowH: pitch - ROW_GAP };
}

function drawMoreNote(ctx, hidden, noun, url, y) {
  setFont(ctx, 26, 600);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'left';
  ctx.fillText(`+ ${hidden} kolejnych ${noun}: ${url}`, PAD, y + 28);
  return NOTE_H;
}

// sections: [{ title, accent, rows: [{ rank, name, sub, color, label, pm25, pm10 }] }]
// Z jedną sekcją pokazuje tyle wierszy, ile się zmieści (od początku listy); reszta jako dopisek z moreUrl i moreNoun
export async function renderRankingImage({ title, subtitle, sections, footer, moreUrl = SITE_HOST, moreNoun = 'pozycji', maxRows }) {
  const { canvas, ctx } = createCanvas();
  let y = drawHeader(ctx, title, subtitle);

  if (sections.length === 1) {
    const [section] = sections;
    y += drawSectionHeader(ctx, section.title, section.accent, y);
    const { shown, hidden, rowH } = computeRowFit(y, section.rows.length, maxRows);
    section.rows.slice(0, shown).forEach((row) => {
      drawStationRow(ctx, row, y, rowH);
      y += rowH + ROW_GAP;
    });
    if (hidden > 0) y += drawMoreNote(ctx, hidden, moreNoun, moreUrl, y);
    drawFooter(ctx, footer, y);
    return toBlob(canvas);
  }

  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);
  const available = BOTTOM - BANNER_MIN - CTA_GAP - y - sections.length * SECTION_HEADER;
  const pitch = Math.min(Math.floor(available / totalRows), MAX_ROW_PITCH);
  const rowH = pitch - ROW_GAP;

  for (const section of sections) {
    y += drawSectionHeader(ctx, section.title, section.accent, y);
    for (const row of section.rows) {
      drawStationRow(ctx, row, y, rowH);
      y += rowH + ROW_GAP;
    }
  }

  drawFooter(ctx, footer, y);
  return toBlob(canvas);
}

// Grafika jednego miasta: poziom i mediany PM, a pod nimi stacje od najwyższego PM2.5 (ile się zmieści, reszta jako dopisek)
// city: { slug, label, color, pm25, pm10, count }, rows: [{ rank, name, sub, color, label, pm25, pm10 }]
export async function renderCityImage({ title, subtitle, city, rows, footer }) {
  const { canvas, ctx } = createCanvas();
  let y = drawHeader(ctx, title, subtitle);

  // Panel z poziomem i medianami
  const panelH = 264;
  ctx.fillStyle = COLORS.row;
  roundRect(ctx, PAD, y, WIDTH - PAD * 2, panelH, 26);
  ctx.fill();
  ctx.fillStyle = hexToRgba(city.color, 0.24);
  roundRect(ctx, PAD, y, WIDTH - PAD * 2, panelH, 26);
  ctx.fill();
  ctx.fillStyle = city.color;
  roundRect(ctx, PAD, y, 16, panelH, 8);
  ctx.fill();

  ctx.textAlign = 'left';
  setFont(ctx, 26, 600);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`Poziom jakości powietrza (mediana ze stacji: ${city.count})`, PAD + 48, y + 50);
  setFont(ctx, 64, 800);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(city.label, PAD + 48, y + 124);

  const metrics = [['PM2.5', city.pm25], ['PM10', city.pm10]];
  metrics.forEach(([name, value], i) => {
    const mx = PAD + 48 + i * 430;
    setFont(ctx, 26, 700);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(name, mx, y + 176);
    setFont(ctx, 72, 800);
    ctx.fillStyle = COLORS.text;
    const text = Number(value).toFixed(1);
    ctx.fillText(text, mx, y + 244);
    const valueW = ctx.measureText(text).width;
    setFont(ctx, 28, 600);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText('µg/m³', mx + valueW + 12, y + 244);
  });
  y += panelH + 36;

  y += drawSectionHeader(ctx, 'Stacje w mieście', city.color, y);

  const { shown, hidden, rowH } = computeRowFit(y, rows.length);
  rows.slice(0, shown).forEach((row) => {
    drawStationRow(ctx, row, y, rowH);
    y += rowH + ROW_GAP;
  });
  if (hidden > 0) y += drawMoreNote(ctx, hidden, 'stacji', `${SITE_HOST}/miasto/${city.slug}`, y);

  drawFooter(ctx, footer, y);
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
  const cardH = Math.min(220, BOTTOM - BANNER_MIN - CTA_GAP - y);
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

  drawFooter(ctx, footer, y + cardH);
  return toBlob(canvas);
}
