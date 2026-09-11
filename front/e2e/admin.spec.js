import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../back/data/database.db');
const ADMIN_EMAIL = 'e2e-admin-dashboard@famille.fr';
const VIEWER_EMAIL = 'e2e-viewer-dashboard@famille.fr';
const TEST_PASSWORD = 'SuperMotDePasse1';
// Hash bcrypt précalculé pour TEST_PASSWORD (évite une dépendance à bcryptjs dans les tests).
const TEST_PASSWORD_HASH = '$2b$10$w/g4gi/UaW.EVGP8xEeYbex3t7YGGKoR32d1EO7H3SZriiVUNL/Da';

function runSql(sql) {
  execFileSync('sqlite3', [DB_PATH, sql]);
}

function resetAdminState() {
  runSql(`
    DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${ADMIN_EMAIL}');
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${ADMIN_EMAIL}');
    DELETE FROM users WHERE email = '${ADMIN_EMAIL}';
    UPDATE setup SET is_completed = 1 WHERE id = 1;
    UPDATE themes SET is_default = 1 WHERE slug = 'christmas-classic';
    UPDATE themes SET is_default = 0 WHERE slug != 'christmas-classic';
    UPDATE calendars
      SET theme_id = (SELECT id FROM themes WHERE slug = 'christmas-classic')
      WHERE slug = 'noel-2026';
    UPDATE feature_flags SET enabled = 1 WHERE key = 'calendar.quiz';
    INSERT INTO users (name, email, password_hash, email_verified, is_active)
      VALUES ('E2E Admin', '${ADMIN_EMAIL}', '${TEST_PASSWORD_HASH}', 1, 1);
    INSERT INTO user_roles (user_id, role_id, organization_id)
      SELECT
        (SELECT id FROM users WHERE email = '${ADMIN_EMAIL}'),
        (SELECT id FROM roles WHERE name = 'admin'),
        (SELECT id FROM organizations WHERE slug = 'default');
  `);
}

function cleanupAdminState() {
  runSql(`
    DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${ADMIN_EMAIL}');
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${ADMIN_EMAIL}');
    DELETE FROM users WHERE email = '${ADMIN_EMAIL}';
    UPDATE themes SET is_default = 1 WHERE slug = 'christmas-classic';
    UPDATE themes SET is_default = 0 WHERE slug != 'christmas-classic';
    UPDATE calendars
      SET theme_id = (SELECT id FROM themes WHERE slug = 'christmas-classic')
      WHERE slug = 'noel-2026';
  `);
}

async function loginAsAdmin(page) {
  await page.goto('/Admin');
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
}

test.describe('Tableau de bord administrateur', () => {
  test.beforeEach(async ({ page }) => {
    resetAdminState();
    await loginAsAdmin(page);
  });

  test.afterAll(() => {
    cleanupAdminState();
  });

  test('affiche les onglets de gestion', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Identité/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Thèmes/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calendrier/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Fonctionnalités/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Utilisateurs/ })).toBeVisible();
  });

  test('active un autre thème et applique les couleurs dynamiquement à toute la page', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Thèmes/ }).click();
    await expect(page.getByRole('heading', { name: 'Thèmes' })).toBeVisible();

    const polarCard = page.locator('.admin-theme-card', { hasText: 'Givre polaire' });
    await polarCard.getByRole('button', { name: 'Activer' }).click();

    await expect(polarCard.locator('.admin-badge')).toHaveText('Actif');

    await expect
      .poll(() =>
        page.evaluate(() => {
          // eslint-disable-next-line no-undef -- exécuté dans le contexte navigateur par Playwright
          return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
        })
      )
      .toBe('#1D4ED8');
  });

  test('modifie l’identité de la plateforme', async ({ page }) => {
    await page.getByRole('button', { name: /Identité/ }).click();
    await page.getByLabel('Nom de la plateforme').fill('Noël des Testeurs');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Identité visuelle mise à jour')).toBeVisible();
  });

  test('bascule une fonctionnalité', async ({ page }) => {
    await page.getByRole('button', { name: /Fonctionnalités/ }).click();
    const item = page.locator('.admin-flag-item', { hasText: 'calendar.quiz' });
    const checkbox = item.locator('input[type=checkbox]');
    await expect(checkbox).toBeChecked();

    await item.locator('.admin-switch span').click();
    await expect(checkbox).not.toBeChecked();
  });

  test('liste l’administrateur connecté dans la gestion des utilisateurs', async ({ page }) => {
    await page.getByRole('button', { name: /Utilisateurs/ }).click();
    await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).toBeVisible();
  });

  test('affiche les statistiques de participation agrégées par jour', async ({ page }) => {
    runSql(`
      DELETE FROM analytics_events WHERE day_number = 1;
      INSERT INTO analytics_events (event_type, day_number) VALUES ('day_opened', 1);
      INSERT INTO analytics_events (event_type, day_number) VALUES ('day_opened', 1);
      INSERT INTO analytics_events (event_type, day_number) VALUES ('quiz_correct', 1);
    `);

    await page.getByRole('button', { name: /Statistiques/ }).click();
    await expect(page.getByTestId('analytics-totals')).toBeVisible();
    await expect(page.getByTestId('analytics-table')).toBeVisible();

    const dayRow = page
      .locator('tbody tr')
      .filter({ has: page.locator('td', { hasText: /^1$/ }) });
    await expect(dayRow).toContainText('2');
  });
});

test.describe('Accès restreint pour un compte non-administrateur', () => {
  test.beforeEach(() => {
    runSql(`
      DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${VIEWER_EMAIL}');
      DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${VIEWER_EMAIL}');
      DELETE FROM users WHERE email = '${VIEWER_EMAIL}';
      UPDATE setup SET is_completed = 1 WHERE id = 1;
      INSERT INTO users (name, email, password_hash, email_verified, is_active)
        VALUES ('E2E Viewer', '${VIEWER_EMAIL}', '${TEST_PASSWORD_HASH}', 1, 1);
    `);
  });

  test.afterAll(() => {
    runSql(`
      DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${VIEWER_EMAIL}');
      DELETE FROM users WHERE email = '${VIEWER_EMAIL}';
    `);
  });

  test('affiche un message d’accès refusé sans le rôle administrateur', async ({ page }) => {
    await page.goto('/Admin');
    await page.getByRole('textbox', { name: 'Email' }).fill(VIEWER_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByRole('alert')).toHaveText(/n’a pas les droits/);
  });
});
