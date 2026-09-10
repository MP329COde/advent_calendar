import { db, getBranding } from '../config/db.js';

function serializeBranding(branding) {
  return {
    platformName: branding.platform_name,
    shortName: branding.short_name,
    tagline: branding.tagline,
    logoUrl: branding.logo_url,
    logoDarkUrl: branding.logo_dark_url,
    logoLightUrl: branding.logo_light_url,
    faviconUrl: branding.favicon_url,
    iconUrl: branding.icon_url,
    ogImageUrl: branding.og_image_url,
    colors: {
      primary: branding.primary_color,
      secondary: branding.secondary_color,
      accent: branding.accent_color,
      background: branding.background_color,
      surface: branding.surface_color,
      text: branding.text_color,
      muted: branding.muted_text_color,
    },
    updatedAt: branding.updated_at,
  };
}

const FIELD_MAP = {
  platformName: 'platform_name',
  shortName: 'short_name',
  tagline: 'tagline',
  logoUrl: 'logo_url',
  logoDarkUrl: 'logo_dark_url',
  logoLightUrl: 'logo_light_url',
  faviconUrl: 'favicon_url',
  iconUrl: 'icon_url',
  ogImageUrl: 'og_image_url',
};

const COLOR_FIELD_MAP = {
  primary: 'primary_color',
  secondary: 'secondary_color',
  accent: 'accent_color',
  background: 'background_color',
  surface: 'surface_color',
  text: 'text_color',
  muted: 'muted_text_color',
};

export function getBrandingHandler(req, res) {
  return res.json(serializeBranding(getBranding()));
}

export function updateBranding(req, res) {
  const body = req.body ?? {};
  const columns = [];
  const values = [];

  for (const [key, column] of Object.entries(FIELD_MAP)) {
    if (typeof body[key] === 'string') {
      columns.push(`${column} = ?`);
      values.push(body[key]);
    }
  }

  if (body.colors && typeof body.colors === 'object') {
    for (const [key, column] of Object.entries(COLOR_FIELD_MAP)) {
      if (typeof body.colors[key] === 'string') {
        columns.push(`${column} = ?`);
        values.push(body.colors[key]);
      }
    }
  }

  if (columns.length === 0) {
    return res.json(serializeBranding(getBranding()));
  }

  columns.push('updated_at = CURRENT_TIMESTAMP');

  db.prepare(`UPDATE branding SET ${columns.join(', ')} WHERE id = 1`).run(...values);

  return res.json(serializeBranding(getBranding()));
}
