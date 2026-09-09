import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche le titre de la page', async ({ page }) => {
    await expect(page).toHaveTitle(/front/i);
  });

  test('affiche le titre principal "Get started"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Get started' })
    ).toBeVisible();
  });

  test('incrémente le compteur à chaque clic sur le bouton', async ({ page }) => {
    const button = page.getByRole('button', { name: /Count is/ });
    await expect(button).toHaveText('Count is 0');

    await button.click();
    await expect(button).toHaveText('Count is 1');

    await button.click();
    await expect(button).toHaveText('Count is 2');
  });

  test('affiche les liens vers la documentation Vite et React', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /Explore Vite/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Learn more/i })
    ).toBeVisible();
  });

  test('affiche les liens de la communauté (GitHub, Discord, X, Bluesky)', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^GitHub$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Discord$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^X\.com$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Bluesky$/ })).toBeVisible();
  });
});
