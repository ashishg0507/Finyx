/** monthKey format YYYY-MM */
export function monthBounds(monthKey) {
  const [y, mo] = monthKey.split('-').map(Number)
  if (!y || !mo || mo < 1 || mo > 12) return null
  const pad = (n) => String(n).padStart(2, '0')
  const start = `${y}-${pad(mo)}-01`
  const end = new Date(y, mo, 0)
  const endStr = `${y}-${pad(mo)}-${pad(end.getDate())}`
  return { start: start, end: endStr }
}

export function monthKeyFromDateString(dateStr) {
  const s = String(dateStr || '').slice(0, 10)
  return s.length >= 7 ? s.slice(0, 7) : null
}

export function previousMonthKey(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth() - 1, 1)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}
