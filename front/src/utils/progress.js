const STORAGE_KEY = 'advent-calendar-opened-days'

export function getOpenedDays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((d) => Number.isInteger(d)) : []
  } catch {
    return []
  }
}

export function markDayOpened(day) {
  const opened = new Set(getOpenedDays())
  opened.add(day)
  const list = [...opened].sort((a, b) => a - b)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

/**
 * Plus longue série de jours consécutifs ouverts se terminant au jour le
 * plus élevé ouvert (streak "en cours", pas la meilleure série historique).
 */
export function computeStreak(openedDays) {
  if (openedDays.length === 0) return 0
  const sorted = [...openedDays].sort((a, b) => a - b)
  let streak = 1
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (sorted[i] - sorted[i - 1] === 1) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}
