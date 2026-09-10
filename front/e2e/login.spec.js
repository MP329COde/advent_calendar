import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../back/data/database.db');
const TEST_EMAIL = 'e2e-login@famille.fr';
const TEST_PASSWORD = 'SuperMotDePasse1';
// Hash bcrypt précalculé pour TEST_PASSWORD (évite une dépendance à bcryptjs dans les tests).
const TEST_PASSWORD_HASH = '$2b$10$w/g4gi/UaW.EVGP8xEeYbex3t7YGGKoR32d1EO7H3SZriiVUNL/Da';

function runSql(sql) {
  execFileSync('sqlite3', [DB_PATH, sql]);
}

function resetState() {
  runSql(`
    DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${TEST_EMAIL}');
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${TEST_EMAIL}');
    DELETE FROM users WHERE email = '${TEST_EMAIL}';
    UPDATE setup SET is_completed = 1 WHERE id = 1;
    INSERT INTO users (name, email, password_hash, email_verified, is_active)
      VALUES ('E2E Login', '${TEST_EMAIL}', '${TEST_PASSWORD_HASH}', 1, 1);
    INSERT INTO user_roles (user_id, role_id, organization_id)
      SELECT
        (SELECT id FROM users WHERE email = '${TEST_EMAIL}'),
        (SELECT id FROM roles WHERE name = 'admin'),
        (SELECT id FROM organizations WHERE slug = 'default');
  `);
}

function cleanupState() {
  runSql(`
    DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '${TEST_EMAIL}');
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${TEST_EMAIL}');
    DELETE FROM users WHERE email = '${TEST_EMAIL}';
  `);
}

test.describe('Authentification administrateur', () => {
  test.beforeEach(() => {
    resetState();
  });

  test.afterAll(() => {
    cleanupState();
  });

  test('affiche le formulaire de connexion sur /Admin quand non authentifié', async ({ page }) => {
    await page.goto('/Admin');
    await expect(page.getByRole('heading', { name: 'Connexion administrateur' })).toBeVisible();
  });

  test('refuse des identifiants invalides', async ({ page }) => {
    await page.goto('/Admin');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Identifiants invalides/);
  });

  test('connecte un administrateur et affiche le tableau de bord', async ({ page }) => {
    await page.goto('/Admin');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
    await expect(page.getByText('Connecté en tant que E2E Login')).toBeVisible();
  });

  test('conserve la session après un rechargement de page', async ({ page }) => {
    await page.goto('/Admin');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
  });

  test('permet de se déconnecter', async ({ page }) => {
    await page.goto('/Admin');
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();

    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await expect(page.getByRole('heading', { name: 'Connexion administrateur' })).toBeVisible();
  });
});
