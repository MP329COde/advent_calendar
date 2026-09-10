import { test, expect } from '@playwright/test';

function mockActiveTheme(page, config) {
  return page.route('**/api/themes/active', async (route) => {
    await route.fulfill({
      json: { id: 1, name: 'Test', description: '', config },
    });
  });
}

function mockDays(page) {
  return page.route('**/api/days', async (route) => {
    const days = Array.from({ length: 24 }, (_, i) => ({
      day: i + 1,
      unlocked: false,
      title: null,
      description: null,
      imageUrl: null,
      audioUrl: null,
    }));
    await route.fulfill({ json: days });
  });
}

test.describe('Musique de page', () => {
  test('aucun lecteur affiché sans configuration', async ({ page }) => {
    await mockDays(page);
    await mockActiveTheme(page, {});
    await page.goto('/');
    await expect(page.getByTestId('page-music-player')).toHaveCount(0);
  });

  test('un lecteur apparaît et se met en pause/lecture au clic quand une musique est configurée', async ({
    page,
  }) => {
    await mockDays(page);
    await mockActiveTheme(page, {
      pages: { home: { musicUrl: '/uploads/test-track.mp3' } },
    });
    await page.route('**/uploads/test-track.mp3', async (route) => {
      await route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from([]) });
    });

    await page.goto('/');
    const toggle = page.locator('.page-music-player__toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Disposition des cases', () => {
  test('respecte un ordre manuel configuré côté thème', async ({ page }) => {
    await mockActiveTheme(page, {
      calendar: { shuffle: 'manual', dayOrder: [24, 1, 2, 3] },
    });
    await page.route('**/api/days', async (route) => {
      const days = Array.from({ length: 24 }, (_, i) => ({
        day: i + 1,
        unlocked: false,
        title: null,
        description: null,
        imageUrl: null,
        audioUrl: null,
      }));
      await route.fulfill({ json: days });
    });

    await page.goto('/');
    const firstCard = page.getByTestId('day-card').first();
    await expect(firstCard).toHaveAttribute('data-day', '24');
  });
});
