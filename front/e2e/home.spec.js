import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche le titre de la page', async ({ page }) => {
    await expect(page).toHaveTitle(/Calendrier de l.Avent/i);
  });

  test('affiche le titre principal du calendrier', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: "Calendrier de l'Avent" })
    ).toBeVisible();
  });

  test('affiche les 24 cases du calendrier', async ({ page }) => {
    await expect(page.getByLabel(/^Jour \d+,/)).toHaveCount(24);
  });

  test('affiche le lien vers le dépôt GitHub dans le pied de page', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: /Voir le projet sur GitHub/i })
    ).toBeVisible();
  });

  test('affiche une page 404 pour une route inconnue', async ({ page }) => {
    await page.goto('/une-route-qui-nexiste-pas');
    await expect(
      page.getByRole('heading', { name: 'Page introuvable' })
    ).toBeVisible();
  });
});
