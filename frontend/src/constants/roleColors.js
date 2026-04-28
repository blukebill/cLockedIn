export const roleColors = {
    Server: '#4A90D9',
    Host: '#7B68EE',
    Cook: '#E8A838',
    Bartender: '#1D9E75',
    'Shift Lead': '#E85D4A',
    Manager: '#5D6D7E',
    Unassigned: '#9CA3AF'
}

function hashColorKey(value) {
    return [...value].reduce((hash, character) => (
        ((hash << 5) - hash + character.charCodeAt(0)) >>> 0
    ), 0)
}

export function getJobCodeColor(jobCode) {
    const jobCodeId = typeof jobCode === 'object' ? jobCode.jobCodeId : null
    const jobCodeName = typeof jobCode === 'object' ? jobCode.role || jobCode.jobCodeName : jobCode
    const normalizedName = jobCodeName?.trim() || 'Unassigned'

    if (normalizedName === 'Unassigned') {
        return roleColors.Unassigned
    }

    const key = `${jobCodeId || ''}:${normalizedName}`
    const hash = hashColorKey(key)
    const hue = hash % 360
    const saturation = 58 + (hash % 12)
    const lightness = 38 + ((hash >> 8) % 8)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
