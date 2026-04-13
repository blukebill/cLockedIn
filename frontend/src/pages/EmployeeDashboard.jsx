import { scheduleData } from '../constants/scheduleData'
import { roleColors } from '../constants/roleColors'
import { getWeekDates } from '../utils/dateUtils'
import { parseShiftStart, parseShiftEnd, calculateHours } from '../utils/scheduleUtils'

const DEMO_EMPLOYEE = 'Marcus J.'

function EmployeeDashboard({ setPage }) {
  const weekDates = getWeekDates()
  const now = new Date()

  const myShifts = scheduleData.filter(s => s.employee === DEMO_EMPLOYEE)

  const totalHours = myShifts.reduce((sum, shift) => {
    return sum + calculateHours(shift.startTime, shift.endTime)
  }, 0)

  const totalWages = myShifts.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

  const upcomingShifts = myShifts
    .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
    .sort((a, b) =>
      parseShiftStart(a.day, a.startTime, weekDates) -
      parseShiftStart(b.day, b.startTime, weekDates)
    )

  const nextShift = upcomingShifts[0]

  const weekLabel = (() => {
    const dates = Object.values(weekDates)
    const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} - ${end}`
  })()

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
        Welcome back, Employee.
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Hours this week</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalHours} hrs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated wages</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">${totalWages}.00</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">before tips + tax</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Next shift</p>
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

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-6">

        {/* Upcoming shifts */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Upcoming shifts</h2>
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

        {/* Announcements */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Announcements</h2>
            <button
              onClick={() => setPage('messages')}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              View all →
            </button>
          </div>

          {announcements.map(a => (
            <div key={a.id}
              onClick={() => setPage('messages')}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-2.5 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">ⓘ {a.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{a.preview}</p>
            </div>
          ))}

          <div className="mt-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">New messages</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">No new messages!</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EmployeeDashboard