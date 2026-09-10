import { db } from '../config/db.js';

/**
 * Vérifie si un jour du calendrier est débloqué.
 *
 * Règle actuelle :
 * - les jours sont accessibles uniquement en décembre ;
 * - le jour N est accessible à partir du 1er décembre pour le jour 1,
 *   du 2 décembre pour le jour 2, etc.
 *
 * Exemple :
 * - 1er décembre → jour 1 débloqué
 * - 10 décembre → jours 1 à 10 débloqués
 * - 1er novembre → aucun jour débloqué
 *
 * @param {number} dayNumber Numéro du jour du calendrier
 * @param {Date} now Date courante
 * @returns {boolean} true si le jour est débloqué
 */
function isDayUnlocked(dayNumber, now = new Date()) {
  const isDecember = now.getMonth() === 11;

  if (!isDecember) {
    return false;
  }

  return dayNumber <= now.getDate();
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
          description
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
      const unlocked = isDayUnlocked(row.day_number, now);

      return {
        day: row.day_number,
        unlocked,
        title: unlocked ? row.title : null,
        description: unlocked ? row.description : null,
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
          description
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

    const unlocked = isDayUnlocked(row.day_number);

    if (!unlocked) {
      return res.status(403).json({
        error: "Ce jour n'est pas encore débloqué",
      });
    }

    return res.json({
      day: row.day_number,
      unlocked: true,
      title: row.title,
      description: row.description,
    });
  } catch (error) {
    console.error('[daysController] Erreur lors de la récupération du jour :', error);

    return res.status(500).json({
      error: 'Impossible de récupérer le jour',
    });
  }
}