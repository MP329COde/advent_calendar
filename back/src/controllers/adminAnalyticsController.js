import { db } from '../config/db.js';

export function getAnalyticsSummary(req, res) {
  const rows = db
    .prepare(`
      SELECT day_number, event_type, COUNT(*) AS count
      FROM analytics_events
      WHERE day_number IS NOT NULL
      GROUP BY day_number, event_type
    `)
    .all();

  const byDay = new Map();
  for (let day = 1; day <= 24; day += 1) {
    byDay.set(day, { day, opens: 0, quizCorrect: 0, quizIncorrect: 0 });
  }

  for (const row of rows) {
    const entry = byDay.get(row.day_number);
    if (!entry) continue;
    if (row.event_type === 'day_opened') entry.opens = row.count;
    if (row.event_type === 'quiz_correct') entry.quizCorrect = row.count;
    if (row.event_type === 'quiz_incorrect') entry.quizIncorrect = row.count;
  }

  const days = [...byDay.values()];
  const totals = days.reduce(
    (acc, d) => ({
      opens: acc.opens + d.opens,
      quizCorrect: acc.quizCorrect + d.quizCorrect,
      quizIncorrect: acc.quizIncorrect + d.quizIncorrect,
    }),
    { opens: 0, quizCorrect: 0, quizIncorrect: 0 }
  );

  return res.json({ days, totals });
}
