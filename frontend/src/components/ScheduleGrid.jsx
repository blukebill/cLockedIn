import { useState } from 'react'
import { scheduleData } from '../constants/scheduleData'
import { days } from '../constants/days'
import { roleColors } from '../constants/roleColors'
import { getNextWeekLabel, getWeekOptions } from '../utils/dateUtils'

const ShiftPill = ({ shift }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-white text-xs"
    style={{ backgroundColor: roleColors[shift.role] }}
  >
    {shift.role}
  </span>
)

const ListView = ({ getShifts }) => (
  <div>
    {days.map(day => (
      <div key={day} className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{day}</h2>
        {['Morning', 'Evening'].map(period => {
          const shifts = getShifts(day, period)
          if (shifts.length === 0) return null
          return (
            <div key={period} className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{period}</h3>
              {shifts.map(shift => (
                <div key={shift.id} className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <ShiftPill shift={shift} />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{shift.employee}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{shift.startTime} - {shift.endTime}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-auto">${shift.estimatedEarnings}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    ))}
  </div>
)

const EmployeeRowView = ({ employees }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="p-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
          {days.map(day => (
            <th key={day} className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {employees.map(employee => (
          <tr key={employee}>
            <td className="p-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">{employee}</td>
            {days.map(day => {
              const morning = scheduleData.find(s => {
                if (s.employee !== employee || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'AM'
              })
              const evening = scheduleData.find(s => {
                if (s.employee !== employee || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'PM'
              })
              return (
                <td key={day} className="p-1 border-b border-gray-200 dark:border-gray-700 align-top min-w-[90px]">
                  {morning && (
                    <div
                      className="rounded text-white text-xs p-1 mb-0.5"
                      style={{ backgroundColor: roleColors[morning.role] }}
                    >
                      <div>{morning.role}</div>
                      <div className="opacity-80">{morning.startTime} - {morning.endTime}</div>
                    </div>
                  )}
                  {evening && (
                    <div
                      className="rounded text-white text-xs p-1"
                      style={{ backgroundColor: roleColors[evening.role] }}
                    >
                      <div>{evening.role}</div>
                      <div className="opacity-80">{evening.startTime} - {evening.endTime}</div>
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const RoleRowView = ({ roles }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="p-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Role</th>
          {days.map(day => (
            <th key={day} className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {roles.map(roleName => (
          <tr key={roleName}>
            <td className="p-2 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
              <span
                className="inline-block px-2 py-0.5 rounded text-white text-xs"
                style={{ backgroundColor: roleColors[roleName] }}
              >
                {roleName}
              </span>
            </td>
            {days.map(day => {
              const morning = scheduleData.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'AM'
              })
              const evening = scheduleData.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'PM'
              })
              return (
                <td key={day} className="p-1 border-b border-gray-200 dark:border-gray-700 align-top min-w-[90px]">
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-1 mb-1">
                    {morning.length > 0
                      ? morning.map(s => <div key={s.id} className="text-xs text-gray-800 dark:text-gray-200">{s.employee}</div>)
                      : <div className="text-xs text-gray-300 dark:text-gray-600">—</div>
                    }
                  </div>
                  <div>
                    {evening.length > 0
                      ? evening.map(s => <div key={s.id} className="text-xs text-gray-800 dark:text-gray-200">{s.employee}</div>)
                      : <div className="text-xs text-gray-300 dark:text-gray-600">—</div>
                    }
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

function ScheduleGrid({ role, isGenerated, setIsGenerated, isPublished, setIsPublished, setPublishedWeek }) {
  const [view, setView] = useState('employee')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(getNextWeekLabel())

  const handleGenerate = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsGenerated(true)
    }, 2000)
  }

  const employees = [...new Set(scheduleData.map(shift => shift.employee))].sort()

  const roleOrder = ['Manager', 'Shift Lead', 'Cook', 'Host', 'Server', 'Bartender']
  const roles = [...new Set(scheduleData.map(shift => shift.role))].sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b))

  const getWeekLabel = () => {
    const start = new Date()
    start.setDate(start.getDate() + weekOffset * 7)
    return `Week of ${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const getShifts = (day, period) => {
    return scheduleData.filter(shift =>
      shift.day === day &&
      (period === 'Morning' ? shift.startTime === '10:00 AM' : shift.startTime === '4:00 PM')
    )
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* Generate screen */}
      {!isGenerated && role === 'manager' && (
        <div className="max-w-lg mx-auto text-center pt-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generate Schedule</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Review the inputs below and click Generate to produce this week's schedule.
          </p>

          <div className="text-left mb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Week</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {getWeekOptions().map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Projected weekly sales</label>
              <input
                type="text"
                defaultValue="$24,500"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Staffing rules</label>
              <input
                type="text"
                defaultValue="Standard coverage — weekday/weekend split"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">⏳ Generating schedule...</p>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors"
            >
              Generate Schedule
            </button>
          )}
        </div>
      )}

      {/* Employee no schedule message */}
      {(!isGenerated || !isPublished) && role === 'employee' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No schedule has been posted yet. Check back soon!
        </p>
      )}

      {/* Schedule view */}
      {isGenerated && (role === 'manager' || isPublished) && (
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getWeekLabel()}</span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                →
              </button>
            </div>

            {role === 'manager' && (
              <div className="flex items-center gap-3">
                {isPublished && (
                  <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium">
                    ✓ Published
                  </span>
                )}
                {!isPublished && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                  >
                    Publish Schedule
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('employee')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'employee' ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Week View
            </button>
            {role === 'manager' && (
              <button
                onClick={() => setView('role')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'role' ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Role View
              </button>
            )}
          </div>

          {view === 'employee' && <EmployeeRowView employees={employees} />}
          {view === 'role' && <RoleRowView roles={roles} />}
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Publish Schedule?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will notify all employees of the schedule for the week of {selectedWeek}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPublished(true)
                  setPublishedWeek(selectedWeek)
                  setShowModal(false)
                }}
                className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ScheduleGrid