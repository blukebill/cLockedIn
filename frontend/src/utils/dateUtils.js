import { days } from '../constants/days'

export function getWeekDates() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

    const weekDates = {}
    days.forEach((day, index) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + index)
        weekDates[day] = date
    })
    return weekDates
}

export function getNextWeekLabel() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + ((8 - dayOfWeek) % 7 || 7))
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)
  const format = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${format(nextMonday)} - ${format(nextSunday)}`
}

export function getWeekOptions() {
  const options = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + ((8 - dayOfWeek) & 7 || 7))
  for (let i = 0; i < 4; i++) {
    const start = new Date(nextMonday)
    start.setDate(nextMonday.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const format = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    options.push(`${format(start)} - ${format(end)}`)
  }
  return options
}