import { db } from '../config/db.js';

/**
 * Vérifie si une case du calendrier vient de se débloquer (même logique que
 * `isDayUnlocked` dans daysController), pour déclencher une notification une
 * seule fois par case (déduplication via la table `notified_unlocks`).
 */
function isUnlocked(row, now) {
  const nowMs = now.getTime();

  if (row.unlock_date) {
    const time = /^\d{2}:\d{2}$/.test(row.unlock_time || '') ? row.unlock_time : '00:00';
    const unlockMs = Date.parse(`${row.unlock_date}T${time}:00Z`);

    if (!Number.isNaN(unlockMs)) {
      return nowMs >= unlockMs;
    }
  }

  return false;
}

/**
 * Scanne les cases du calendrier par défaut pour repérer celles qui viennent
 * de se débloquer, et crée une notification en base pour chaque utilisateur
 * actif — une seule fois par case, grâce à `notified_unlocks`. Conçu pour
 * être appelé périodiquement (setInterval) par le serveur, sans dépendance
 * externe (pas de service d'e-mail ni de push tiers requis).
 */
export function checkAndCreateUnlockNotifications() {
  try {
    const calendar = db
      .prepare('SELECT id FROM calendars WHERE slug = ? LIMIT 1')
      .get('noel-2026');

    if (!calendar) return;

    const now = new Date();

    const days = db
      .prepare(`
        SELECT day_number, title, unlock_date, unlock_time
        FROM calendar_days
        WHERE calendar_id = ? AND is_enabled = 1
      `)
      .all(calendar.id);

    const alreadyNotified = new Set(
      db
        .prepare('SELECT day_number FROM notified_unlocks WHERE calendar_id = ?')
        .all(calendar.id)
        .map((row) => row.day_number)
    );

    const newlyUnlocked = days.filter(
      (day) => !alreadyNotified.has(day.day_number) && isUnlocked(day, now)
    );

    if (newlyUnlocked.length === 0) return;

    const activeUsers = db.prepare('SELECT id FROM users WHERE is_active = 1').all();

    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, calendar_id, type, title, message, data)
      VALUES (?, ?, 'day_unlock', ?, ?, ?)
    `);
    const markNotified = db.prepare(
      'INSERT INTO notified_unlocks (calendar_id, day_number) VALUES (?, ?)'
    );

    const run = db.transaction(() => {
      for (const day of newlyUnlocked) {
        const title = `Case ${day.day_number} débloquée 🎄`;
        const message = day.title
          ? `« ${day.title} » est maintenant disponible !`
          : `La case n°${day.day_number} est maintenant disponible !`;
        const data = JSON.stringify({ day: day.day_number });

        for (const user of activeUsers) {
          insertNotification.run(user.id, calendar.id, title, message, data);
        }

        markNotified.run(calendar.id, day.day_number);
      }
    });

    run();
  } catch (error) {
    console.error(
      '[notificationsController] Erreur lors de la génération des notifications :',
      error
    );
  }
}

export function getNotifications(req, res) {
  const notifications = db
    .prepare(`
      SELECT id, type, title, message, is_read, data, created_at, read_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .all(req.user.id);

  const unreadCount = db
    .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(req.user.id).count;

  return res.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      ...n,
      isRead: Boolean(n.is_read),
      is_read: undefined,
      data: JSON.parse(n.data || '{}'),
    })),
  });
}

export function markNotificationRead(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const result = db
    .prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .run(id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification introuvable' });
  }

  return res.json({ success: true });
}

export function markAllNotificationsRead(req, res) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND is_read = 0
  `).run(req.user.id);

  return res.json({ success: true });
}
