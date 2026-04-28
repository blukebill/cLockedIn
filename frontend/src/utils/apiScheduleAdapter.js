export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function toRole(role) {
  if (!role) return 'Unassigned'
  return role
    .toLowerCase()
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function toAppRole(apiRole) {
  return apiRole?.toLowerCase() || null
}

export function getMonday(date = new Date()) {
  const copy = new Date(date)
  const day = copy.getDay()
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - ((day + 6) % 7))
  return copy
}

export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function weekStartForOffset(offset = 0) {
  return toIsoDate(addDays(getMonday(), offset * 7))
}

export function nextWeekStart() {
  return toIsoDate(addDays(getMonday(), 7))
}

export function formatDateLabel(isoDate, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', options)
}

export function formatWeekRange(startDate) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = addDays(start, 6)
  return `${formatDateLabel(toIsoDate(start))} - ${formatDateLabel(toIsoDate(end))}`
}

export function getApiWeekOptions(count = 4) {
  const start = new Date(`${nextWeekStart()}T00:00:00`)
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index * 7)
    const value = toIsoDate(date)
    return { value, label: formatWeekRange(value) }
  })
}

export function formatTime(value) {
  if (!value) return ''
  const [hoursPart, minutesPart] = value.split(':')
  let hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`
}

export function scheduleToShifts(schedule) {
  return (schedule?.shifts || []).map(shift => {
    const date = new Date(`${shift.shiftDate}T00:00:00`)
    const role = toRole(shift.jobCodeName)
    return {
      id: shift.id,
      employee: shift.employeeName || 'Unassigned',
      employeeId: shift.employeeId,
      isUnassigned: !shift.employeeId,
      role,
      jobCodeId: shift.jobCodeId,
      day: dayNames[date.getDay()],
      shiftDate: shift.shiftDate,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      estimatedEarnings: 0,
      status: shift.status,
      source: shift.source,
    }
  })
}
