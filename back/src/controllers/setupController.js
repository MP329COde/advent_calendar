import bcrypt from 'bcryptjs';
import { db, getSetup, getEnabledLanguages } from '../config/db.js';

const SALT_ROUNDS = 10;

function serializeSetup(setup) {
  return {
    isCompleted: Boolean(setup.is_completed),
    currentStep: setup.current_step,
    platformName: setup.platform_name,
    organizationName: setup.organization_name,
    language: setup.language,
    timezone: setup.timezone,
  };
}

export function getSetupStatus(req, res) {
  const setup = getSetup();
  return res.json(serializeSetup(setup));
}

export function getSetupMeta(req, res) {
  const languages = getEnabledLanguages().map((language) => ({
    code: language.code,
    name: language.name,
    nativeName: language.native_name,
    isDefault: Boolean(language.is_default),
  }));

  const themes = db
    .prepare(`
      SELECT id, name, slug, description, config
      FROM themes
      WHERE is_active = 1
      ORDER BY is_default DESC, name ASC
    `)
    .all()
    .map((theme) => {
      let colors = {};
      try {
        colors = JSON.parse(theme.config)?.colors ?? {};
      } catch {
        colors = {};
      }

      return {
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        isDefault: Boolean(theme.is_default),
        colors,
      };
    });

  const features = db
    .prepare(`
      SELECT key, enabled, description
      FROM feature_flags
      WHERE key LIKE 'calendar.%'
      ORDER BY key ASC
    `)
    .all()
    .map((feature) => ({
      key: feature.key,
      enabled: Boolean(feature.enabled),
      description: feature.description,
    }));

  return res.json({ languages, themes, features });
}

export function completeSetup(req, res) {
  const setup = getSetup();

  if (setup.is_completed) {
    return res.status(409).json({ error: 'La configuration a déjà été effectuée' });
  }

  const {
    platformName,
    organizationName,
    language = 'fr',
    timezone = 'Europe/Paris',
    themeSlug,
    features,
    admin,
  } = req.body ?? {};

  if (typeof platformName !== 'string' || platformName.trim() === '') {
    return res.status(400).json({ error: 'Le nom de la plateforme est requis' });
  }

  if (typeof organizationName !== 'string' || organizationName.trim() === '') {
    return res.status(400).json({ error: "Le nom de l'organisation est requis" });
  }

  if (!admin || typeof admin !== 'object') {
    return res.status(400).json({ error: 'Les informations du compte administrateur sont requises' });
  }

  const { name, email, password } = admin;

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: "Le nom de l'administrateur est requis" });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Un email valide est requis' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.trim().toLowerCase());

  if (existingUser) {
    return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
  }

  const defaultOrganization = db
    .prepare('SELECT id FROM organizations WHERE slug = ?')
    .get('default');

  const adminRole = db
    .prepare('SELECT id FROM roles WHERE name = ?')
    .get('admin');

  const selectedTheme = db
    .prepare('SELECT id, config FROM themes WHERE slug = ? AND is_active = 1')
    .get(typeof themeSlug === 'string' ? themeSlug : '');

  const selectedFeatureKeys = Array.isArray(features)
    ? features.filter((key) => typeof key === 'string')
    : null;

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  const runSetup = db.transaction(() => {
    const { lastInsertRowid: userId } = db
      .prepare(`
        INSERT INTO users (name, email, password_hash, email_verified)
        VALUES (?, ?, ?, 1)
      `)
      .run(name.trim(), email.trim().toLowerCase(), passwordHash);

    if (adminRole && defaultOrganization) {
      db.prepare(`
        INSERT OR IGNORE INTO user_roles (user_id, role_id, organization_id)
        VALUES (?, ?, ?)
      `).run(userId, adminRole.id, defaultOrganization.id);
    }

    if (defaultOrganization) {
      db.prepare(`
        UPDATE organizations
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(organizationName.trim(), defaultOrganization.id);
    }

    if (selectedTheme) {
      let colors = {};
      try {
        colors = JSON.parse(selectedTheme.config)?.colors ?? {};
      } catch {
        colors = {};
      }

      db.prepare(`
        UPDATE branding
        SET platform_name = ?,
            primary_color = COALESCE(?, primary_color),
            secondary_color = COALESCE(?, secondary_color),
            accent_color = COALESCE(?, accent_color),
            background_color = COALESCE(?, background_color),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        platformName.trim(),
        colors.primary ?? null,
        colors.secondary ?? null,
        colors.accent ?? null,
        colors.background ?? null
      );

      const defaultCalendar = db
        .prepare('SELECT id FROM calendars WHERE slug = ?')
        .get('noel-2026');

      if (defaultCalendar) {
        db.prepare(`
          UPDATE calendars
          SET theme_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(selectedTheme.id, defaultCalendar.id);

        db.prepare(`
          UPDATE calendar_themes
          SET primary_color = COALESCE(?, primary_color),
              secondary_color = COALESCE(?, secondary_color),
              accent_color = COALESCE(?, accent_color),
              background_color = COALESCE(?, background_color),
              updated_at = CURRENT_TIMESTAMP
          WHERE calendar_id = ?
        `).run(
          colors.primary ?? null,
          colors.secondary ?? null,
          colors.accent ?? null,
          colors.background ?? null,
          defaultCalendar.id
        );
      }
    } else {
      db.prepare(`
        UPDATE branding
        SET platform_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(platformName.trim());
    }

    if (selectedFeatureKeys) {
      const setFeatureEnabled = db.prepare(`
        UPDATE feature_flags
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `);

      const allCalendarFeatures = db
        .prepare(`SELECT key FROM feature_flags WHERE key LIKE 'calendar.%'`)
        .all();

      for (const { key } of allCalendarFeatures) {
        setFeatureEnabled.run(selectedFeatureKeys.includes(key) ? 1 : 0, key);
      }
    }

    db.prepare(`
      UPDATE setup
      SET is_completed = 1,
          current_step = 1,
          platform_name = ?,
          organization_name = ?,
          language = ?,
          timezone = ?,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(platformName.trim(), organizationName.trim(), language, timezone);

    return userId;
  });

  try {
    runSetup();
  } catch (error) {
    console.error('[setupController] Erreur lors de la configuration initiale :', error);
    return res.status(500).json({ error: 'Impossible de finaliser la configuration' });
  }

  const updatedSetup = getSetup();
  return res.status(201).json(serializeSetup(updatedSetup));
}
