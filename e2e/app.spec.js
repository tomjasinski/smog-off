import { test, expect } from '@playwright/test';
import { stationKey, hashId } from '../lib/stationKey.js';

// Stacja z danych testowych (identyfikator ze źródła: "szerokość,długość,nazwa")
const POZNAN_1 = { id: '52.40000,16.92000,SP 1 Poznań', name: 'SP 1 Poznań' };

test.describe('mapa i ustawienia', () => {
  test('motyw wybrany w ustawieniach jest zapamiętany po odświeżeniu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ustawienia' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Ustawienia' });
    await dialog.getByLabel('Ciemny').check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('szczegóły ulubionej stacji: pogoda w jednym rzędzie i interpretacja WHO', async ({ page }) => {
    await page.addInitScript((favorite) => {
      localStorage.setItem('smogoff.favorites', JSON.stringify([favorite]));
    }, POZNAN_1);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await page.getByRole('button', { name: /Ulubione stacje/ }).click();
    const station = page.getByRole('button', { name: new RegExp(POZNAN_1.name) }).first();
    await expect(station).toBeEnabled();
    await station.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('WHO');
    const tops = await dialog
      .locator('[class*="weatherGrid"] > div')
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(tops).toHaveLength(3);
    expect(new Set(tops).size).toBe(1);

    // "W ulubionych" i "Udostępnij" są w jednej linii
    const row = await dialog
      .locator('[class*="dialogActions"] button')
      .evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().top)));
    expect(row).toHaveLength(2);
    expect(new Set(row).size).toBe(1);
  });
});

test.describe('języki', () => {
  test('strona miasta po polsku i po angielsku', async ({ page }) => {
    await page.goto('/miasto/poznan');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jakość powietrza: Poznań');

    await page.goto('/en/miasto/poznan');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Air quality: Poznań');
    await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute('href', /\/miasto\/poznan$/);
  });

  test('artykuł na blogu zostaje po polsku także w wersji angielskiej', async ({ page }) => {
    await page.goto('/en/blog/czym-jest-pm25-pm10');
    await expect(page.getByText('This article is available in Polish only.')).toBeVisible();
    await expect(page.locator('article')).toHaveAttribute('lang', 'pl');
  });
});

test.describe('miasta', () => {
  test('sortowanie listy miast po jakości i alfabetycznie', async ({ page }) => {
    await page.goto('/miasta');
    const firstCity = () => page.locator('tbody tr').first().locator('th a');

    await page.getByLabel('Sortuj').selectOption({ label: 'Jakość: od najbardziej zanieczyszczonych' });
    await expect(firstCity()).toHaveText('Warszawa');

    await page.getByLabel('Sortuj').selectOption({ label: 'Jakość: od najczystszych' });
    await expect(firstCity()).toHaveText('Poznań');

    await page.getByLabel('Sortuj').selectOption({ label: 'Alfabetycznie A–Z' });
    await expect(firstCity()).toHaveText('Poznań');
  });

  test('strona miasta ma udostępnianie linku i grafiki', async ({ page }) => {
    await page.goto('/miasto/poznan');
    await expect(page.getByRole('button', { name: 'Udostępnij', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Udostępnij jako grafikę' })).toBeVisible();
  });
});

test.describe('podgląd linków', () => {
  test('strona stacji ma znaczniki Open Graph z krótkim adresem obrazu', async ({ page, request }) => {
    const key = stationKey(POZNAN_1);
    await page.goto(`/stacja/${key}`);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image).toContain(`/api/og?station=${hashId(POZNAN_1.id)}`);
    expect(image.length).toBeLessThan(120);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /SP 1 Poznań/);

    const response = await request.get(`/api/og?station=${hashId(POZNAN_1.id)}&lang=en`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
  });

  test('stare linki ze pełnym identyfikatorem stacji nadal działają', async ({ request }) => {
    const response = await request.get(`/stacja/${encodeURIComponent(POZNAN_1.id)}`);
    expect(response.status()).toBe(200);
  });
});

test('strona o danych jest dostępna', async ({ page }) => {
  await page.goto('/o-danych');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('O danych i metodologii');
  await page.goto('/en/o-danych');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About the data and methodology');
});
