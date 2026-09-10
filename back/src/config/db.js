import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || 'data';
const DATABASE_FILE = path.join(DATA_DIR, 'database.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DATABASE_FILE);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

const tableExists = (tableName) => {
  const result = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `)
    .get(tableName);

  return Boolean(result);
};

const columnExists = (tableName, columnName) => {
  if (!tableExists(tableName)) {
    return false;
  }

  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all();

  return columns.some((column) => column.name === columnName);
};

const addColumn = (tableName, columnName, definition) => {
  if (!columnExists(tableName, columnName)) {
    db.exec(`
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${definition}
    `);
  }
};

db.exec(`
  BEGIN;

  CREATE TABLE IF NOT EXISTS setup (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1),
    platform_name TEXT NOT NULL DEFAULT 'Calendrier de l’Avent',
    organization_name TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'fr',
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    value_type TEXT NOT NULL DEFAULT 'string'
      CHECK (value_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS branding (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    platform_name TEXT NOT NULL DEFAULT 'Calendrier de l’Avent',
    short_name TEXT NOT NULL DEFAULT 'Avent',
    tagline TEXT NOT NULL DEFAULT '',
    logo_url TEXT,
    logo_dark_url TEXT,
    logo_light_url TEXT,
    favicon_url TEXT,
    icon_url TEXT,
    og_image_url TEXT,
    background_video_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#B91C1C',
    secondary_color TEXT NOT NULL DEFAULT '#166534',
    accent_color TEXT NOT NULL DEFAULT '#D4AF37',
    background_color TEXT NOT NULL DEFAULT '#FFFFFF',
    surface_color TEXT NOT NULL DEFAULT '#FFFFFF',
    text_color TEXT NOT NULL DEFAULT '#111827',
    muted_text_color TEXT NOT NULL DEFAULT '#6B7280',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    config TEXT NOT NULL DEFAULT '{}',
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feature_flags (
    key TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    config TEXT NOT NULL DEFAULT '{}',
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    translation_key TEXT NOT NULL,
    value TEXT NOT NULL,
    UNIQUE (language_code, translation_key),
    FOREIGN KEY (language_code)
      REFERENCES languages(code)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    logo_url TEXT,
    email TEXT,
    website TEXT,
    country TEXT,
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    language TEXT NOT NULL DEFAULT 'fr',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (language)
      REFERENCES languages(code)
      ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (organization_id, key),
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    avatar_url TEXT,
    language TEXT NOT NULL DEFAULT 'fr',
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (language)
      REFERENCES languages(code)
      ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)
      REFERENCES roles(id)
      ON DELETE CASCADE,
    FOREIGN KEY (permission_id)
      REFERENCES permissions(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id, organization_id),
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    FOREIGN KEY (role_id)
      REFERENCES roles(id)
      ON DELETE CASCADE,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calendar_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    preview_url TEXT,
    config TEXT NOT NULL DEFAULT '{}',
    is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE,
    FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS calendars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    owner_user_id INTEGER,
    theme_id INTEGER,
    template_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 9999),
    start_date TEXT,
    end_date TEXT,
    language TEXT NOT NULL DEFAULT 'fr',
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'published', 'archived')),
    is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL,
    FOREIGN KEY (theme_id)
      REFERENCES themes(id)
      ON DELETE SET NULL,
    FOREIGN KEY (template_id)
      REFERENCES calendar_templates(id)
      ON DELETE SET NULL,
    FOREIGN KEY (language)
      REFERENCES languages(code)
      ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS calendar_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendar_id INTEGER NOT NULL UNIQUE,
    total_days INTEGER NOT NULL DEFAULT 24 CHECK (total_days BETWEEN 1 AND 31),
    allow_late_open INTEGER NOT NULL DEFAULT 1 CHECK (allow_late_open IN (0, 1)),
    allow_future_open INTEGER NOT NULL DEFAULT 0 CHECK (allow_future_open IN (0, 1)),
    require_login INTEGER NOT NULL DEFAULT 0 CHECK (require_login IN (0, 1)),
    show_progress INTEGER NOT NULL DEFAULT 1 CHECK (show_progress IN (0, 1)),
    show_countdown INTEGER NOT NULL DEFAULT 1 CHECK (show_countdown IN (0, 1)),
    show_locked_days INTEGER NOT NULL DEFAULT 1 CHECK (show_locked_days IN (0, 1)),
    auto_mark_as_opened INTEGER NOT NULL DEFAULT 1 CHECK (auto_mark_as_opened IN (0, 1)),
    allow_multiple_attempts INTEGER NOT NULL DEFAULT 1 CHECK (allow_multiple_attempts IN (0, 1)),
    enable_sound INTEGER NOT NULL DEFAULT 1 CHECK (enable_sound IN (0, 1)),
    enable_animations INTEGER NOT NULL DEFAULT 1 CHECK (enable_animations IN (0, 1)),
    enable_confetti INTEGER NOT NULL DEFAULT 1 CHECK (enable_confetti IN (0, 1)),
    enable_notifications INTEGER NOT NULL DEFAULT 1 CHECK (enable_notifications IN (0, 1)),
    enable_statistics INTEGER NOT NULL DEFAULT 1 CHECK (enable_statistics IN (0, 1)),
    enable_comments INTEGER NOT NULL DEFAULT 0 CHECK (enable_comments IN (0, 1)),
    settings TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calendar_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendar_id INTEGER NOT NULL UNIQUE,
    primary_color TEXT NOT NULL DEFAULT '#C62828',
    secondary_color TEXT NOT NULL DEFAULT '#2E7D32',
    background_color TEXT NOT NULL DEFAULT '#FFFDF7',
    surface_color TEXT NOT NULL DEFAULT '#FFFFFF',
    text_color TEXT NOT NULL DEFAULT '#111827',
    muted_text_color TEXT NOT NULL DEFAULT '#6B7280',
    accent_color TEXT NOT NULL DEFAULT '#D4AF37',
    font_family TEXT NOT NULL DEFAULT 'system-ui',
    heading_font_family TEXT,
    background_image TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    card_style TEXT NOT NULL DEFAULT 'classic',
    grid_style TEXT NOT NULL DEFAULT 'grid',
    border_radius INTEGER NOT NULL DEFAULT 16 CHECK (border_radius >= 0),
    animation_enabled INTEGER NOT NULL DEFAULT 1 CHECK (animation_enabled IN (0, 1)),
    sound_enabled INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1)),
    config TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calendar_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendar_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 31),
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    unlock_date TEXT,
    unlock_time TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    is_locked INTEGER NOT NULL DEFAULT 1 CHECK (is_locked IN (0, 1)),
    preview_url TEXT,
    icon TEXT,
    color TEXT,
    badge TEXT,
    settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (calendar_id, day_number),
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS day_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL,
    content_type TEXT NOT NULL
      CHECK (
        content_type IN (
          'text',
          'image',
          'video',
          'audio',
          'quiz',
          'riddle',
          'recipe',
          'gift',
          'quote',
          'link',
          'download',
          'gallery',
          'embed',
          'html',
          'custom'
        )
      ),
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    url TEXT,
    media_url TEXT,
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_required INTEGER NOT NULL DEFAULT 0 CHECK (is_required IN (0, 1)),
    settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (day_id)
      REFERENCES calendar_days(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    calendar_id INTEGER,
    day_id INTEGER,
    media_type TEXT NOT NULL
      CHECK (media_type IN ('image', 'video', 'audio', 'file')),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    alt_text TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    uploaded_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE,
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE,
    FOREIGN KEY (day_id)
      REFERENCES calendar_days(id)
      ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS calendar_users (
    calendar_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer'
      CHECK (role IN ('viewer', 'editor', 'owner')),
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (calendar_id, user_id),
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_calendar_progress (
    user_id INTEGER NOT NULL,
    calendar_id INTEGER NOT NULL,
    opened_days INTEGER NOT NULL DEFAULT 0 CHECK (opened_days >= 0),
    completed_days INTEGER NOT NULL DEFAULT 0 CHECK (completed_days >= 0),
    total_score INTEGER NOT NULL DEFAULT 0,
    last_opened_day INTEGER,
    started_at TEXT,
    last_activity_at TEXT,
    PRIMARY KEY (user_id, calendar_id),
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_day_progress (
    user_id INTEGER NOT NULL,
    day_id INTEGER NOT NULL,
    opened_at TEXT,
    completed_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    score INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    data TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (user_id, day_id),
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    FOREIGN KEY (day_id)
      REFERENCES calendar_days(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    is_correct INTEGER CHECK (is_correct IN (0, 1)),
    score INTEGER NOT NULL DEFAULT 0,
    metadata TEXT NOT NULL DEFAULT '{}',
    answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    FOREIGN KEY (content_id)
      REFERENCES day_contents(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    calendar_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TEXT,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    FOREIGN KEY (calendar_id)
      REFERENCES calendars(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    type TEXT NOT NULL,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    organization_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE SET NULL,
    FOREIGN KEY (organization_id)
      REFERENCES organizations(id)
      ON DELETE SET NULL
  );

  COMMIT;
`);

if (tableExists('branding')) {
  addColumn('branding', 'background_video_url', 'TEXT');
}

if (tableExists('users')) {
  addColumn('users', 'email', 'TEXT');
  addColumn('users', 'password_hash', 'TEXT');
  addColumn('users', 'avatar_url', 'TEXT');
  addColumn('users', 'language', "TEXT NOT NULL DEFAULT 'fr'");
  addColumn('users', 'timezone', "TEXT NOT NULL DEFAULT 'Europe/Paris'");
  addColumn('users', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
  addColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('users', 'last_login_at', 'TEXT');
  addColumn('users', 'created_at', "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
  addColumn('users', 'updated_at', "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
}

if (tableExists('system')) {
  const systemRows = db
    .prepare('SELECT key, value FROM system')
    .all();

  const insertSystemSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (
      key,
      value
    )
    VALUES (?, ?)
  `);

  const migrateSystem = db.transaction(() => {
    for (const row of systemRows) {
      insertSystemSetting.run(row.key, row.value);
    }
  });

  migrateSystem();
}

const setupExists = db
  .prepare('SELECT id FROM setup WHERE id = 1')
  .get();

if (!setupExists) {
  db.prepare(`
    INSERT INTO setup (
      id,
      is_completed,
      current_step,
      platform_name,
      organization_name,
      language,
      timezone
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    0,
    1,
    'Calendrier de l’Avent',
    '',
    'fr',
    'Europe/Paris'
  );
}

const languages = [
  ['fr', 'French', 'Français', 1, 1],
  ['en', 'English', 'English', 1, 0],
  ['de', 'German', 'Deutsch', 1, 0],
  ['es', 'Spanish', 'Español', 1, 0],
  ['it', 'Italian', 'Italiano', 1, 0]
];

const insertLanguage = db.prepare(`
  INSERT OR IGNORE INTO languages (
    code,
    name,
    native_name,
    enabled,
    is_default
  )
  VALUES (?, ?, ?, ?, ?)
`);

const seedLanguages = db.transaction(() => {
  for (const language of languages) {
    insertLanguage.run(...language);
  }
});

seedLanguages();

const platformSettings = [
  ['platform.name', 'Calendrier de l’Avent', 'string', 'Nom de la plateforme'],
  ['platform.default_language', 'fr', 'string', 'Langue par défaut'],
  ['platform.default_timezone', 'Europe/Paris', 'string', 'Fuseau horaire par défaut'],
  ['platform.maintenance_mode', 'false', 'boolean', 'Mode maintenance'],
  ['platform.registration_enabled', 'true', 'boolean', 'Autoriser les inscriptions'],
  ['platform.analytics_enabled', 'true', 'boolean', 'Activer les statistiques'],
  ['platform.notifications_enabled', 'true', 'boolean', 'Activer les notifications'],
  ['platform.media_library_enabled', 'true', 'boolean', 'Activer la médiathèque'],
  ['platform.public_calendars_enabled', 'true', 'boolean', 'Autoriser les calendriers publics']
];

const insertPlatformSetting = db.prepare(`
  INSERT OR IGNORE INTO platform_settings (
    key,
    value,
    value_type,
    description
  )
  VALUES (?, ?, ?, ?)
`);

const seedPlatformSettings = db.transaction(() => {
  for (const setting of platformSettings) {
    insertPlatformSetting.run(...setting);
  }
});

seedPlatformSettings();

const brandingExists = db
  .prepare('SELECT id FROM branding WHERE id = 1')
  .get();

if (!brandingExists) {
  db.prepare(`
    INSERT INTO branding (
      id,
      platform_name,
      short_name,
      tagline,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      muted_text_color
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    'Calendrier de l’Avent',
    'Avent',
    'Votre calendrier de l’Avent numérique',
    '#B91C1C',
    '#166534',
    '#D4AF37',
    '#FFFFFF',
    '#FFFFFF',
    '#111827',
    '#6B7280'
  );
}

const themeExists = db
  .prepare(`
    SELECT id
    FROM themes
    WHERE slug = ?
  `)
  .get('christmas-classic');

let defaultThemeId;

if (themeExists) {
  defaultThemeId = themeExists.id;
} else {
  const themeResult = db.prepare(`
    INSERT INTO themes (
      name,
      slug,
      description,
      config,
      is_default,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'Noël classique',
    'christmas-classic',
    'Thème classique de Noël',
    JSON.stringify({
      colors: {
        primary: '#B91C1C',
        secondary: '#166534',
        accent: '#D4AF37',
        background: '#FFFDF7',
        surface: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280'
      },
      typography: {
        fontFamily: 'system-ui',
        headingFontFamily: 'system-ui',
        headingWeight: 700,
        bodyWeight: 400
      },
      shape: {
        radius: 16
      },
      effects: {
        shadows: true,
        glass: false,
        glow: true
      },
      animation: {
        enabled: true,
        snow: true,
        stars: true,
        confetti: true
      },
      calendar: {
        cardStyle: 'classic',
        gridStyle: 'grid'
      }
    }),
    1,
    1
  );

  defaultThemeId = Number(themeResult.lastInsertRowid);
}

const additionalThemes = [
  {
    name: 'Givre polaire',
    slug: 'polar-frost',
    description: 'Palette bleutée et glacée, ambiance nuit étoilée',
    colors: {
      primary: '#1D4ED8',
      secondary: '#0EA5E9',
      accent: '#E0F2FE',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      muted: '#64748B'
    },
    animation: { enabled: true, snow: true, stars: true, confetti: false }
  },
  {
    name: 'Or festif',
    slug: 'festive-gold',
    description: 'Tons chauds ambrés et dorés, élégance feutrée',
    colors: {
      primary: '#92400E',
      secondary: '#B45309',
      accent: '#FDE68A',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      text: '#1C1917',
      muted: '#78716C'
    },
    animation: { enabled: true, snow: false, stars: true, confetti: true }
  },
  {
    name: 'Minuit violet',
    slug: 'midnight-violet',
    description: 'Ambiance sombre et magique, idéale en soirée',
    colors: {
      primary: '#7C3AED',
      secondary: '#4C1D95',
      accent: '#C4B5FD',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      muted: '#94A3B8'
    },
    animation: { enabled: true, snow: true, stars: true, confetti: true }
  }
];

const insertTheme = db.prepare(`
  INSERT INTO themes (name, slug, description, config, is_default, is_active)
  VALUES (?, ?, ?, ?, 0, 1)
`);

const seedAdditionalThemes = db.transaction(() => {
  for (const theme of additionalThemes) {
    const exists = db
      .prepare('SELECT id FROM themes WHERE slug = ?')
      .get(theme.slug);

    if (exists) continue;

    insertTheme.run(
      theme.name,
      theme.slug,
      theme.description,
      JSON.stringify({
        colors: theme.colors,
        typography: {
          fontFamily: 'system-ui',
          headingFontFamily: 'system-ui',
          headingWeight: 700,
          bodyWeight: 400
        },
        shape: { radius: 16 },
        effects: { shadows: true, glass: false, glow: true },
        animation: theme.animation,
        calendar: { cardStyle: 'classic', gridStyle: 'grid' }
      })
    );
  }
});

seedAdditionalThemes();

const featureFlags = [
  ['calendar.quiz', 1, '{}', 'Activer les quiz'],
  ['calendar.riddle', 1, '{}', 'Activer les énigmes'],
  ['calendar.recipe', 1, '{}', 'Activer les recettes'],
  ['calendar.video', 1, '{}', 'Activer les vidéos'],
  ['calendar.audio', 1, '{}', 'Activer les contenus audio'],
  ['calendar.gallery', 1, '{}', 'Activer les galeries'],
  ['calendar.gift', 1, '{}', 'Activer les cadeaux'],
  ['calendar.embed', 1, '{}', 'Activer les contenus intégrés'],
  ['calendar.download', 1, '{}', 'Activer les téléchargements'],
  ['calendar.public', 1, '{}', 'Autoriser les calendriers publics'],
  ['platform.registration', 1, '{}', 'Activer les inscriptions'],
  ['platform.notifications', 1, '{}', 'Activer les notifications'],
  ['platform.analytics', 1, '{}', 'Activer les statistiques'],
  ['platform.media_library', 1, '{}', 'Activer la médiathèque'],
  ['platform.templates', 1, '{}', 'Activer les modèles'],
  ['platform.translations', 1, '{}', 'Activer les traductions']
];

const insertFeatureFlag = db.prepare(`
  INSERT OR IGNORE INTO feature_flags (
    key,
    enabled,
    config,
    description
  )
  VALUES (?, ?, ?, ?)
`);

const seedFeatureFlags = db.transaction(() => {
  for (const feature of featureFlags) {
    insertFeatureFlag.run(...feature);
  }
});

seedFeatureFlags();

const roles = [
  ['admin', 'Administrateur complet de la plateforme'],
  ['editor', 'Éditeur de contenu'],
  ['calendar_manager', 'Gestionnaire de calendriers'],
  ['viewer', 'Utilisateur avec accès en lecture'],
  ['user', 'Utilisateur standard']
];

const insertRole = db.prepare(`
  INSERT OR IGNORE INTO roles (
    name,
    description
  )
  VALUES (?, ?)
`);

const seedRoles = db.transaction(() => {
  for (const role of roles) {
    insertRole.run(...role);
  }
});

seedRoles();

const permissions = [
  ['platform.view', 'Voir la plateforme'],
  ['platform.manage', 'Gérer la plateforme'],
  ['organization.view', 'Voir une organisation'],
  ['organization.manage', 'Gérer une organisation'],
  ['users.view', 'Voir les utilisateurs'],
  ['users.manage', 'Gérer les utilisateurs'],
  ['roles.view', 'Voir les rôles'],
  ['roles.manage', 'Gérer les rôles'],
  ['calendars.view', 'Voir les calendriers'],
  ['calendars.create', 'Créer des calendriers'],
  ['calendars.edit', 'Modifier les calendriers'],
  ['calendars.delete', 'Supprimer les calendriers'],
  ['calendars.publish', 'Publier les calendriers'],
  ['days.view', 'Voir les jours'],
  ['days.create', 'Créer des jours'],
  ['days.edit', 'Modifier les jours'],
  ['days.delete', 'Supprimer les jours'],
  ['content.view', 'Voir les contenus'],
  ['content.create', 'Créer du contenu'],
  ['content.edit', 'Modifier le contenu'],
  ['content.delete', 'Supprimer du contenu'],
  ['media.view', 'Voir les médias'],
  ['media.upload', 'Importer des médias'],
  ['media.delete', 'Supprimer des médias'],
  ['themes.view', 'Voir les thèmes'],
  ['themes.manage', 'Gérer les thèmes'],
  ['templates.view', 'Voir les modèles'],
  ['templates.manage', 'Gérer les modèles'],
  ['settings.view', 'Voir les paramètres'],
  ['settings.manage', 'Modifier les paramètres'],
  ['analytics.view', 'Voir les statistiques'],
  ['audit.view', 'Voir le journal d’audit']
];

const insertPermission = db.prepare(`
  INSERT OR IGNORE INTO permissions (
    key,
    description
  )
  VALUES (?, ?)
`);

const seedPermissions = db.transaction(() => {
  for (const permission of permissions) {
    insertPermission.run(...permission);
  }
});

seedPermissions();

const adminRole = db
  .prepare(`
    SELECT id
    FROM roles
    WHERE name = ?
  `)
  .get('admin');

if (adminRole) {
  const permissionRows = db
    .prepare('SELECT id FROM permissions')
    .all();

  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (
      role_id,
      permission_id
    )
    VALUES (?, ?)
  `);

  const seedAdminPermissions = db.transaction(() => {
    for (const permission of permissionRows) {
      insertRolePermission.run(adminRole.id, permission.id);
    }
  });

  seedAdminPermissions();
}

const organizationExists = db
  .prepare(`
    SELECT id
    FROM organizations
    WHERE slug = ?
  `)
  .get('default');

let defaultOrganizationId;

if (organizationExists) {
  defaultOrganizationId = organizationExists.id;
} else {
  const organizationResult = db.prepare(`
    INSERT INTO organizations (
      name,
      slug,
      description,
      language,
      timezone
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Mon organisation',
    'default',
    'Organisation principale',
    'fr',
    'Europe/Paris'
  );

  defaultOrganizationId = Number(
    organizationResult.lastInsertRowid
  );
}

const organizationSettings = [
  [defaultOrganizationId, 'default_calendar_days', '24'],
  [defaultOrganizationId, 'allow_public_calendars', 'true'],
  [defaultOrganizationId, 'allow_user_registration', 'true'],
  [defaultOrganizationId, 'show_statistics', 'true'],
  [defaultOrganizationId, 'default_theme', 'christmas-classic'],
  [defaultOrganizationId, 'default_language', 'fr'],
  [defaultOrganizationId, 'default_timezone', 'Europe/Paris']
];

const insertOrganizationSetting = db.prepare(`
  INSERT OR IGNORE INTO organization_settings (
    organization_id,
    key,
    value
  )
  VALUES (?, ?, ?)
`);

const seedOrganizationSettings = db.transaction(() => {
  for (const setting of organizationSettings) {
    insertOrganizationSetting.run(...setting);
  }
});

seedOrganizationSettings();

const calendarExists = db
  .prepare(`
    SELECT id
    FROM calendars
    WHERE slug = ?
  `)
  .get('noel-2026');

let defaultCalendarId;

if (calendarExists) {
  defaultCalendarId = calendarExists.id;
} else {
  const calendarResult = db.prepare(`
    INSERT INTO calendars (
      organization_id,
      theme_id,
      name,
      slug,
      description,
      year,
      start_date,
      end_date,
      language,
      timezone,
      status,
      is_public
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    defaultOrganizationId,
    defaultThemeId,
    'Noël 2026',
    'noel-2026',
    'Calendrier de l’Avent 2026',
    2026,
    '2026-12-01',
    '2026-12-24',
    'fr',
    'Europe/Paris',
    'draft',
    1
  );

  defaultCalendarId = Number(
    calendarResult.lastInsertRowid
  );

  db.prepare(`
    INSERT INTO calendar_settings (
      calendar_id,
      total_days,
      allow_late_open,
      allow_future_open,
      require_login,
      show_progress,
      show_countdown,
      show_locked_days,
      auto_mark_as_opened,
      allow_multiple_attempts,
      enable_sound,
      enable_animations,
      enable_confetti,
      enable_notifications,
      enable_statistics,
      enable_comments
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    defaultCalendarId,
    24,
    1,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0
  );

  db.prepare(`
    INSERT INTO calendar_themes (
      calendar_id,
      primary_color,
      secondary_color,
      background_color,
      surface_color,
      text_color,
      muted_text_color,
      accent_color,
      font_family,
      heading_font_family,
      card_style,
      grid_style,
      border_radius,
      animation_enabled,
      sound_enabled,
      config
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    defaultCalendarId,
    '#C62828',
    '#2E7D32',
    '#FFFDF7',
    '#FFFFFF',
    '#111827',
    '#6B7280',
    '#D4AF37',
    'system-ui',
    'system-ui',
    'classic',
    'grid',
    16,
    1,
    1,
    JSON.stringify({
      snow: true,
      stars: true,
      glow: true,
      shadows: true,
      confetti: true
    })
  );

  const insertDay = db.prepare(`
    INSERT INTO calendar_days (
      calendar_id,
      day_number,
      title,
      description,
      unlock_date,
      unlock_time,
      is_enabled,
      is_locked,
      settings
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedDays = db.transaction(() => {
    for (let day = 1; day <= 24; day += 1) {
      insertDay.run(
        defaultCalendarId,
        day,
        `Défi du jour ${day}`,
        '',
        `2026-12-${String(day).padStart(2, '0')}`,
        '00:00',
        1,
        1,
        JSON.stringify({
          animation: 'open',
          sound: true,
          showCounter: true
        })
      );
    }
  });

  seedDays();
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_organizations_slug
    ON organizations(slug);

  CREATE INDEX IF NOT EXISTS idx_organizations_language
    ON organizations(language);

  CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

  CREATE INDEX IF NOT EXISTS idx_users_username
    ON users(username);

  CREATE INDEX IF NOT EXISTS idx_user_roles_user
    ON user_roles(user_id);

  CREATE INDEX IF NOT EXISTS idx_user_roles_role
    ON user_roles(role_id);

  CREATE INDEX IF NOT EXISTS idx_user_roles_organization
    ON user_roles(organization_id);

  CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON user_sessions(user_id);

  CREATE INDEX IF NOT EXISTS idx_sessions_expires
    ON user_sessions(expires_at);

  CREATE INDEX IF NOT EXISTS idx_calendars_organization
    ON calendars(organization_id);

  CREATE INDEX IF NOT EXISTS idx_calendars_owner
    ON calendars(owner_user_id);

  CREATE INDEX IF NOT EXISTS idx_calendars_theme
    ON calendars(theme_id);

  CREATE INDEX IF NOT EXISTS idx_calendars_template
    ON calendars(template_id);

  CREATE INDEX IF NOT EXISTS idx_calendars_status
    ON calendars(status);

  CREATE INDEX IF NOT EXISTS idx_calendars_year
    ON calendars(year);

  CREATE INDEX IF NOT EXISTS idx_calendar_days_calendar
    ON calendar_days(calendar_id);

  CREATE INDEX IF NOT EXISTS idx_calendar_days_unlock
    ON calendar_days(unlock_date, unlock_time);

  CREATE INDEX IF NOT EXISTS idx_day_contents_day
    ON day_contents(day_id);

  CREATE INDEX IF NOT EXISTS idx_day_contents_position
    ON day_contents(day_id, position);

  CREATE INDEX IF NOT EXISTS idx_media_organization
    ON media(organization_id);

  CREATE INDEX IF NOT EXISTS idx_media_calendar
    ON media(calendar_id);

  CREATE INDEX IF NOT EXISTS idx_media_day
    ON media(day_id);

  CREATE INDEX IF NOT EXISTS idx_media_uploaded_by
    ON media(uploaded_by);

  CREATE INDEX IF NOT EXISTS idx_calendar_users_calendar
    ON calendar_users(calendar_id);

  CREATE INDEX IF NOT EXISTS idx_calendar_users_user
    ON calendar_users(user_id);

  CREATE INDEX IF NOT EXISTS idx_user_calendar_progress_user
    ON user_calendar_progress(user_id);

  CREATE INDEX IF NOT EXISTS idx_user_calendar_progress_calendar
    ON user_calendar_progress(calendar_id);

  CREATE INDEX IF NOT EXISTS idx_user_day_progress_user
    ON user_day_progress(user_id);

  CREATE INDEX IF NOT EXISTS idx_user_day_progress_day
    ON user_day_progress(day_id);

  CREATE INDEX IF NOT EXISTS idx_user_answers_user
    ON user_answers(user_id);

  CREATE INDEX IF NOT EXISTS idx_user_answers_content
    ON user_answers(content_id);

  CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

  CREATE INDEX IF NOT EXISTS idx_notifications_calendar
    ON notifications(calendar_id);

  CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications(user_id, is_read);

  CREATE INDEX IF NOT EXISTS idx_backups_organization
    ON backups(organization_id);

  CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs(user_id);

  CREATE INDEX IF NOT EXISTS idx_audit_logs_organization
    ON audit_logs(organization_id);

  CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);
`);

export function getSetup() {
  return db
    .prepare(`
      SELECT *
      FROM setup
      WHERE id = 1
    `)
    .get();
}

export function getBranding() {
  return db
    .prepare(`
      SELECT *
      FROM branding
      WHERE id = 1
    `)
    .get();
}

export function getEnabledLanguages() {
  return db
    .prepare(`
      SELECT *
      FROM languages
      WHERE enabled = 1
      ORDER BY is_default DESC, name ASC
    `)
    .all();
}

export function getPlatformSetting(key) {
  return db
    .prepare(`
      SELECT *
      FROM platform_settings
      WHERE key = ?
    `)
    .get(key);
}

export function isFeatureEnabled(key) {
  const feature = db
    .prepare(`
      SELECT enabled
      FROM feature_flags
      WHERE key = ?
    `)
    .get(key);

  return Boolean(feature?.enabled);
}

export function getDefaultOrganization() {
  return db
    .prepare(`
      SELECT *
      FROM organizations
      WHERE slug = ?
    `)
    .get('default');
}

export function getDefaultCalendar() {
  return db
    .prepare(`
      SELECT *
      FROM calendars
      WHERE slug = ?
    `)
    .get('noel-2026');
}

export function closeDatabase() {
  if (db.open) {
    db.close();
  }
}

console.log(`[database] SQLite initialisée : ${DATABASE_FILE}`);