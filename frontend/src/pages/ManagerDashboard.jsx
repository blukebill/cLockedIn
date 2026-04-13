import { scheduleData } from '../constants/scheduleData'
import { roleColors } from '../constants/roleColors'
import { getWeekDates } from '../utils/dateUtils'
import { parseShiftStart, parseShiftEnd, calculateHours } from '../utils/scheduleUtils'

const DEMO_MANAGER = 'Tony N.'

function ManagerDashboard({ setPage }) {
  const weekDates = getWeekDates()
  const now = new Date()

  const myShifts = scheduleData.filter(s => s.employee === DEMO_MANAGER)

  const totalPersonalHours = myShifts.reduce((sum, shift) => {
    return sum + calculateHours(shift.startTime, shift.endTime)
  }, 0)

  const totalPersonalWages = myShifts.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

  const upcomingShifts = myShifts
    .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
    .sort((a, b) =>
      parseShiftStart(a.day, a.startTime, weekDates) -
      parseShiftStart(b.day, b.startTime, weekDates)
    )

  const nextShift = upcomingShifts[0]

  const totalTeamHours = scheduleData.reduce((sum, shift) => {
    return sum + calculateHours(shift.startTime, shift.endTime)
  }, 0)

  const totalLaborCost = scheduleData.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

  const weekLabel = (() => {
    const dates = Object.values(weekDates)
    const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} - ${end}`
  })()

  const alerts = [
    { id: 1, type: 'warning', message: 'Wednesday morning has no Host scheduled' },
    { id: 2, type: 'request', message: 'Rachel K. has requested time off Saturday' },
  ]

  const announcements = [
    { id: 1, title: 'Holiday Hours', preview: 'Hey team, we will be operating on reduced hours this Sunday...' },
    { id: 2, title: 'Schedule Posted', preview: "Next week's schedule has been posted. Please review your shifts..." },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        This week ({weekLabel})
      </p>
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Welcome back, {DEMO_MANAGER}.
      </h1>

      {/* Personal summary cards */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Your week</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your hours this week</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalPersonalHours} hrs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your estimated wages</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">${totalPersonalWages}.00</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">before tips + tax</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your next shift</p>
          {nextShift ? (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {weekDates[nextShift.day].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-white text-xs mb-1"
                style={{ backgroundColor: roleColors[nextShift.role] }}>
                {nextShift.role}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextShift.startTime} - {nextShift.endTime}
              </p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">No upcoming shifts</p>
          )}
        </div>
      </div>

      {/* Team overview cards */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Team overview</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total team hours</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalTeamHours} hrs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total labor cost</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">${totalLaborCost.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">estimated this week</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Labor percentage</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">28.4%</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">based on projected sales</p>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-6">

        {/* Upcoming personal shifts */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Your upcoming shifts</h2>
            <button
              onClick={() => setPage('schedule')}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              View full schedule →
            </button>
          </div>

          {upcomingShifts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming shifts this week.</p>
          ) : (
            upcomingShifts.map(shift => (
              <div key={shift.id} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: roleColors[shift.role] }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {weekDates[shift.day].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {shift.role} · {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${shift.estimatedEarnings}</p>
              </div>
            ))
          )}
        </div>

        {/* Alerts and announcements */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Team alerts</h2>
          {alerts.map(alert => (
            <div key={alert.id} className={`p-3 rounded-lg border mb-2.5 ${
              alert.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            }`}>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {alert.type === 'warning' ? '⚠️' : '📋'} {alert.message}
              </p>
            </div>
          ))}

          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-3">Announcements</h2>
          {announcements.map(a => (
            <div key={a.id}
              onClick={() => setPage('messages')}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-2.5 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">ⓘ {a.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{a.preview}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default ManagerDashboard