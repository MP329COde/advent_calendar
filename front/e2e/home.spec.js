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

test.describe('Ouverture d\'une case débloquée', () => {
  test('affiche le contenu (titre, image, audio) dans la fenêtre modale', async ({ page }) => {
    await page.route('**/api/days', async (route) => {
      const days = Array.from({ length: 24 }, (_, i) => {
        const day = i + 1;
        const unlocked = day === 1;
        return {
          day,
          unlocked,
          title: unlocked ? 'Un test de Noël' : null,
          description: unlocked ? 'Description du défi du jour 1.' : null,
          imageUrl: unlocked ? '/uploads/test-image.png' : null,
          audioUrl: unlocked ? '/uploads/test-audio.mp3' : null,
        };
      });
      await route.fulfill({ json: days });
    });

    await page.route('**/api/days/1', async (route) => {
      await route.fulfill({
        json: {
          day: 1,
          unlocked: true,
          title: 'Un test de Noël',
          description: 'Description du défi du jour 1.',
          imageUrl: '/uploads/test-image.png',
          audioUrl: '/uploads/test-audio.mp3',
        },
      });
    });

    const onePxPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );
    await page.route('**/uploads/test-image.png', async (route) => {
      await route.fulfill({ contentType: 'image/png', body: onePxPng });
    });
    await page.route('**/uploads/test-audio.mp3', async (route) => {
      await route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from([]) });
    });

    await page.goto('/');

    const unlockedCard = page.getByTestId('day-card').and(page.locator('[data-unlocked="true"]'));
    await expect(unlockedCard).toHaveCount(1);
    await unlockedCard.click();

    const modal = page.getByTestId('day-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('day-modal-content')).toContainText('Un test de Noël');
    await expect(page.getByTestId('day-modal-content')).toContainText('Description du défi du jour 1.');
    await expect(page.getByTestId('day-modal-image')).toBeVisible();
    await expect(page.getByTestId('day-modal-audio')).toBeVisible();

    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('affiche le lien externe et le code promo quand ils sont configurés', async ({ page }) => {
    await page.route('**/api/days', async (route) => {
      const days = Array.from({ length: 24 }, (_, i) => {
        const day = i + 1;
        const unlocked = day === 1;
        return {
          day,
          unlocked,
          title: unlocked ? 'Jour promo' : null,
          description: null,
          imageUrl: null,
          audioUrl: null,
          linkUrl: unlocked ? 'https://example.com/promo' : null,
          promoCode: unlocked ? 'NOEL2026' : null,
        };
      });
      await route.fulfill({ json: days });
    });

    await page.route('**/api/days/1', async (route) => {
      await route.fulfill({
        json: {
          day: 1,
          unlocked: true,
          title: 'Jour promo',
          description: null,
          imageUrl: null,
          audioUrl: null,
          linkUrl: 'https://example.com/promo',
          promoCode: 'NOEL2026',
        },
      });
    });

    await page.goto('/');
    await page.getByTestId('day-card').and(page.locator('[data-unlocked="true"]')).click();

    await expect(page.getByTestId('day-modal-link')).toHaveAttribute('href', 'https://example.com/promo');
    await expect(page.getByTestId('day-modal-promo')).toContainText('NOEL2026');
  });

  test('une case verrouillée ne peut pas être ouverte', async ({ page }) => {
    await page.goto('/');
    const lockedCard = page.getByTestId('day-card').and(page.locator('[data-unlocked="false"]')).first();
    await expect(lockedCard).toBeDisabled();
    await expect(page.getByTestId('day-modal')).toHaveCount(0);
  });
});
