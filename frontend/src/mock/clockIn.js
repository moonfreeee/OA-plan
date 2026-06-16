function storageKey(userId) {
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `sdo_clock_in_${userId}_${date}`
}

export function isClockedIn(userId) {
  if (typeof localStorage === 'undefined') return false
  return !!localStorage.getItem(storageKey(userId))
}

export function setClockIn(userId) {
  const time = new Date().toISOString()
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey(userId), time)
  }
  return time
}

export function getClockInTime(userId) {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(storageKey(userId))
}
