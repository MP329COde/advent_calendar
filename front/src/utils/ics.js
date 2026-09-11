function toIcsDate(isoDate) {
  return isoDate.replaceAll('-', '')
}

function escapeIcsText(text) {
  return text.replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
}

export function buildRemindersIcs(days, calendarName = "Calendrier de l'Avent") {
  const events = days
    .filter((d) => d.unlockDate)
    .map((d) => {
      const date = toIcsDate(d.unlockDate)
      const summary = escapeIcsText(`${calendarName} — Jour ${d.day}`)
      return [
        'BEGIN:VEVENT',
        `UID:advent-day-${d.day}-${date}@calendar`,
        `DTSTAMP:${date}T000000Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:${summary}`,
        'END:VEVENT',
      ].join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendrier de l\'Avent//FR',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
