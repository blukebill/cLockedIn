export function parseShiftEnd(day, endTime, weekDates) {
    const date = new Date(weekDates[day])
    const [time,period] = endTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    date.setHours(hours, minutes, 0, 0)
    return date
}

export function parseShiftStart(day, startTime, weekDates) {
    const date = new Date(weekDates[day])
    const [time, period] = startTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    date.setHours(hours, minutes, 0, 0)
    return date
}

export function calculateHours(startTime, endTime) {
    const parseTime = (t) => {
        const [time, period] = t.split(' ')
        let [hours, minutes] = time.split(':').map(Number)
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        return hours + minutes / 60
    }
    return parseTime(endTime) - parseTime(startTime)
}