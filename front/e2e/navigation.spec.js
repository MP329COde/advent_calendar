import { test, expect } from '@playwright/test';

test.describe('Navigation entre les pages', () => {
  test('accès direct à une route inconnue affiche la page 404', async ({
    page,
  }) => {
    const response = await page.goto('/une-route-qui-nexiste-pas');
    expect(response.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Page introuvable' })
    ).toBeVisible();
    await expect(page).toHaveTitle(/Page introuvable/i);
  });

  test('rechargement direct sur une route inconnue reste sur la 404', async ({
    page,
  }) => {
    await page.goto('/une-route-qui-nexiste-pas');
    const response = await page.reload();
    expect(response.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Page introuvable' })
    ).toBeVisible();
  });

  test('le lien "Retour à l\'accueil" ramène sur la page d\'accueil', async ({
    page,
  }) => {
    await page.goto('/une-route-qui-nexiste-pas');
    await page.getByRole('link', { name: "Retour à l'accueil" }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: "Calendrier de l'Avent" })
    ).toBeVisible();
    await expect(page).toHaveTitle(/^Calendrier de l.Avent$/i);
  });

  test('le bouton retour du navigateur revient sur la page précédente', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/une-route-qui-nexiste-pas');
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: "Calendrier de l'Avent" })
    ).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL('/une-route-qui-nexiste-pas');
    await expect(
      page.getByRole('heading', { name: 'Page introuvable' })
    ).toBeVisible();
  });

  test("aucune erreur console lors de la navigation", async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.goto('/une-route-qui-nexiste-pas');
    await page.getByRole('link', { name: "Retour à l'accueil" }).click();
    await page.goBack();
    await page.goForward();

    expect(errors).toEqual([]);
  });
});
