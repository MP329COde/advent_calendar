import { db } from '../config/db.js';

function parseSettings(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Vérifie si un jour du calendrier est débloqué, en se basant sur les
 * colonnes `unlock_date` (YYYY-MM-DD) et `unlock_time` (HH:MM) stockées en
 * base, comparées à l'heure serveur exprimée en UTC. C'est la source de
 * vérité (source unique, non falsifiable côté client) : on ne fait jamais
 * confiance à l'horloge du navigateur.
 *
 * Si `unlock_date` est absente (ligne non initialisée), on retombe sur
 * l'ancienne règle calendaire "jour N = 1er décembre + (N-1) jours" pour ne
 * pas casser une base non migrée, mais calculée dynamiquement sur l'année
 * courante plutôt que codée en dur sur 2026.
 *
 * @param {{unlock_date?: string, unlock_time?: string, day_number: number}} row
 * @param {Date} now Date courante (UTC)
 * @returns {boolean} true si le jour est débloqué
 */
function isDayUnlocked(row, now = new Date()) {
  const nowMs = now.getTime();

  if (row.unlock_date) {
    const time = /^\d{2}:\d{2}$/.test(row.unlock_time || '') ? row.unlock_time : '00:00';
    const unlockMs = Date.parse(`${row.unlock_date}T${time}:00Z`);

    if (!Number.isNaN(unlockMs)) {
      return nowMs >= unlockMs;
    }
  }

  const isDecember = now.getUTCMonth() === 11;

  if (!isDecember) {
    return false;
  }

  return row.day_number <= now.getUTCDate();
}

/**
 * Récupère les 24 jours du calendrier Noël 2026.
 *
 * La table utilisée est `calendar_days`.
 * Le numéro du jour est stocké dans `day_number`.
 */
export function getDays(req, res) {
  try {
    const rows = db
      .prepare(`
        SELECT
          id,
          day_number,
          title,
          description,
          unlock_date,
          unlock_time,
          settings
        FROM calendar_days
        WHERE calendar_id = (
          SELECT id
          FROM calendars
          WHERE slug = ?
          LIMIT 1
        )
        ORDER BY day_number ASC
      `)
      .all('noel-2026');

    const now = new Date();

    const days = rows.map((row) => {
      const unlocked = isDayUnlocked(row, now);
      const settings = parseSettings(row.settings);

      return {
        day: row.day_number,
        unlocked,
        title: unlocked ? row.title : null,
        description: unlocked ? row.description : null,
        imageUrl: unlocked ? settings.imageUrl ?? null : null,
        audioUrl: unlocked ? settings.audioUrl ?? null : null,
        linkUrl: unlocked ? settings.linkUrl ?? null : null,
        promoCode: unlocked ? settings.promoCode ?? null : null,
      };
    });

    return res.json(days);
  } catch (error) {
    console.error('[daysController] Erreur lors de la récupération des jours :', error);

    return res.status(500).json({
      error: 'Impossible de récupérer les jours du calendrier',
    });
  }
}

/**
 * Récupère un jour précis du calendrier.
 *
 * Paramètre attendu :
 * GET /days/:day
 *
 * Exemple :
 * GET /days/1
 */
export function getDay(req, res) {
  try {
    const day = Number(req.params.day);

    if (!Number.isInteger(day) || day < 1 || day > 24) {
      return res.status(400).json({
        error: 'Jour invalide',
      });
    }

    const row = db
      .prepare(`
        SELECT
          id,
          day_number,
          title,
          description,
          unlock_date,
          unlock_time,
          settings
        FROM calendar_days
        WHERE calendar_id = (
          SELECT id
          FROM calendars
          WHERE slug = ?
          LIMIT 1
        )
        AND day_number = ?
        LIMIT 1
      `)
      .get('noel-2026', day);

    if (!row) {
      return res.status(404).json({
        error: 'Jour introuvable',
      });
    }

    const unlocked = isDayUnlocked(row);

    if (!unlocked) {
      return res.status(403).json({
        error: "Ce jour n'est pas encore débloqué",
      });
    }

    const settings = parseSettings(row.settings);

    return res.json({
      day: row.day_number,
      unlocked: true,
      title: row.title,
      description: row.description,
      imageUrl: settings.imageUrl ?? null,
      audioUrl: settings.audioUrl ?? null,
      linkUrl: settings.linkUrl ?? null,
      promoCode: settings.promoCode ?? null,
    });
  } catch (error) {
    console.error('[daysController] Erreur lors de la récupération du jour :', error);

    return res.status(500).json({
      error: 'Impossible de récupérer le jour',
    });
  }
}