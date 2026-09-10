import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../back/data/database.db');
const TEST_EMAIL = 'e2e-admin@famille.fr';

function runSql(sql) {
  execFileSync('sqlite3', [DB_PATH, sql]);
}

function resetSetupState() {
  runSql(`
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${TEST_EMAIL}');
    DELETE FROM users WHERE email = '${TEST_EMAIL}';
    UPDATE setup SET is_completed = 0, platform_name = 'Calendrier de l’Avent', organization_name = '', completed_at = NULL WHERE id = 1;
    UPDATE organizations SET name = 'Mon organisation' WHERE slug = 'default';
    UPDATE branding SET platform_name = 'Calendrier de l’Avent', primary_color = '#B91C1C', secondary_color = '#166534', accent_color = '#D4AF37', background_color = '#FFFFFF' WHERE id = 1;
    UPDATE calendars SET theme_id = (SELECT id FROM themes WHERE slug = 'christmas-classic') WHERE slug = 'noel-2026';
    UPDATE calendar_themes SET primary_color = '#C62828', secondary_color = '#2E7D32', background_color = '#FFFDF7' WHERE calendar_id = (SELECT id FROM calendars WHERE slug = 'noel-2026');
    UPDATE feature_flags SET enabled = 1 WHERE key LIKE 'calendar.%';
  `);
}

test.describe('Assistant de configuration initiale', () => {
  test.beforeEach(async () => {
    resetSetupState();
  });

  test.afterAll(async () => {
    resetSetupState();
  });

  test('redirige automatiquement vers /setup tant que la configuration est incomplète', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/setup$/);
    await expect(page.getByRole('heading', { name: 'Bienvenue !' })).toBeVisible();
  });

  test('affiche la progression et les 6 étapes du wizard', async ({ page }) => {
    await page.goto('/setup');
    const steps = page.getByRole('list', { name: 'Étapes de configuration' });
    await expect(steps).toBeVisible();
    for (const label of [
      'Bienvenue',
      'Plateforme',
      'Thème',
      'Fonctionnalités',
      'Administrateur',
      'Récapitulatif',
    ]) {
      await expect(steps.getByText(label)).toBeVisible();
    }
  });

  test('bloque l’étape Plateforme tant que les champs requis sont vides', async ({ page }) => {
    await page.goto('/setup');
    await page.getByRole('button', { name: 'Commencer la configuration' }).click();
    await page.getByRole('textbox', { name: 'Nom de l’organisation' }).fill('');
    await page.getByRole('button', { name: 'Suivant' }).click();
    // Le champ requis empêche la navigation HTML5 : on reste sur l'étape Plateforme.
    await expect(
      page.getByRole('heading', { name: 'Informations de la plateforme' })
    ).toBeVisible();
  });

  test('propose plusieurs thèmes chargés depuis le backend', async ({ page }) => {
    await page.goto('/setup');
    await page.getByRole('button', { name: 'Commencer la configuration' }).click();
    await page.getByRole('textbox', { name: 'Nom de l’organisation' }).fill('Famille Test');
    await page.getByRole('button', { name: 'Suivant' }).click();

    await expect(page.getByRole('heading', { name: 'Choisissez un thème' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Noël classique/ })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Givre polaire/ })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Minuit violet/ })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Or festif/ })
    ).toBeVisible();
  });

  test('parcourt le wizard complet et crée le compte administrateur', async ({ page }) => {
    await page.goto('/setup');

    // Étape 1 — Bienvenue
    await page.getByRole('button', { name: 'Commencer la configuration' }).click();

    // Étape 2 — Plateforme
    await page.getByRole('textbox', { name: 'Nom de l’organisation' }).fill('Famille Test E2E');
    await page.getByRole('combobox', { name: 'Langue' }).selectOption('fr');
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 3 — Thème
    await page.getByRole('button', { name: /Minuit violet/ }).click();
    await expect(page.getByRole('button', { name: /Minuit violet/ })).toHaveClass(
      /is-selected/
    );
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 4 — Fonctionnalités : on désactive Quiz et Cadeaux
    await page.getByRole('button', { name: /Quiz/ }).click();
    await page.getByRole('button', { name: /Cadeaux/ }).click();
    await expect(page.getByRole('button', { name: /Quiz/ })).not.toHaveClass(/is-selected/);
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 5 — Administrateur
    await page.getByRole('textbox', { name: 'Nom de l’administrateur' }).fill('Admin E2E');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill('SuperMotDePasse1');
    await page
      .getByRole('textbox', { name: 'Confirmation du mot de passe' })
      .fill('SuperMotDePasse1');
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 6 — Récapitulatif
    await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible();
    await expect(page.getByText('Famille Test E2E')).toBeVisible();
    await expect(page.getByText('Minuit violet')).toBeVisible();
    await expect(page.getByText(/8 activée\(s\)/)).toBeVisible();
    await expect(page.getByText(`Admin E2E (${TEST_EMAIL})`)).toBeVisible();

    await page.getByRole('button', { name: 'Terminer la configuration' }).click();

    await expect(page.getByRole('heading', { name: 'Configuration terminée !' })).toBeVisible();
    await expect(page).toHaveURL(/\/Admin$/, { timeout: 5000 });

    // Revenir sur /setup ne réaffiche plus l'assistant une fois terminé.
    await page.goto('/setup');
    await expect(page).toHaveURL(/\/Admin$/);
  });

  test('refuse une confirmation de mot de passe différente', async ({ page }) => {
    await page.goto('/setup');
    await page.getByRole('button', { name: 'Commencer la configuration' }).click();
    await page.getByRole('textbox', { name: 'Nom de l’organisation' }).fill('Famille Test');
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();

    await page.getByRole('textbox', { name: 'Nom de l’administrateur' }).fill('Admin E2E');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill('MotDePasse1');
    await page
      .getByRole('textbox', { name: 'Confirmation du mot de passe' })
      .fill('AutreMotDePasse2');
    await page.getByRole('button', { name: 'Suivant' }).click();

    await page.getByRole('button', { name: 'Terminer la configuration' }).click();
    await expect(page.getByText('ne correspondent pas')).toBeVisible();
  });
});
