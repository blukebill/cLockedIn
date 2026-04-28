import { useCallback, useEffect, useState } from 'react'
import { days } from '../constants/days'
import { getJobCodeColor } from '../constants/roleColors'
import {
  forecastsApi,
  jobCodesApi,
  restaurantSettingsApi,
  schedulesApi,
  staffingRulesApi,
} from '../services/api'
import {
  addDays,
  dayNames,
  formatDateLabel,
  formatWeekRange,
  getApiWeekOptions,
  nextWeekStart,
  scheduleToShifts,
  toIsoDate,
} from '../utils/apiScheduleAdapter'

const dayCodes = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const createEmptyStaffingForm = (jobCodeId = '') => ({
  id: null,
  dayOfWeek: 'MONDAY',
  jobCodeId,
  headsPerEmployee: '',
})

const ShiftPill = ({ shift }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-white text-xs"
    style={{ backgroundColor: getJobCodeColor(shift) }}
  >
    {shift.role}
  </span>
)

const timeLabelToMinutes = (value) => {
  const match = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)
  if (!match) return 0
  const [, hourPart, minutePart, period] = match
  const hour = Number(hourPart) % 12
  return (hour + (period === 'PM' ? 12 : 0)) * 60 + Number(minutePart)
}

const sortShiftsByTime = (first, second) => (
  first.shiftDate.localeCompare(second.shiftDate)
  || timeLabelToMinutes(first.startTime) - timeLabelToMinutes(second.startTime)
  || first.role.localeCompare(second.role)
  || first.id - second.id
)

const ShiftBlock = ({ shift }) => (
  <div
    className="rounded text-white text-xs p-1 mb-1 last:mb-0"
    style={{ backgroundColor: getJobCodeColor(shift) }}
  >
    <div>{shift.role}</div>
    <div className="opacity-80">{shift.startTime} - {shift.endTime}</div>
    {shift.isUnassigned && <div className="opacity-80">Unassigned</div>}
  </div>
)

const EmployeeRowView = ({ employees, shifts }) => (
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
              const dayShifts = shifts
                .filter(s => s.employee === employee && s.day === day)
                .sort(sortShiftsByTime)
              return (
                <td key={day} className="p-1 border-b border-gray-200 dark:border-gray-700 align-top min-w-22.5">
                  {dayShifts.map(shift => <ShiftBlock key={shift.id} shift={shift} />)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
    {shifts.length === 0 && (
      <div className="py-10 text-center border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No shifts were generated for this week.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check that open days have forecasts and active shift templates with minimum or maximum coverage.</p>
      </div>
    )}
  </div>
)

const RoleRowView = ({ roles, shifts }) => (
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
                style={{ backgroundColor: getJobCodeColor(roleName) }}
              >
                {roleName}
              </span>
            </td>
            {days.map(day => {
              const morning = shifts.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'AM'
              })
              const evening = shifts.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'PM'
              })
              return (
                <td key={day} className="p-1 border-b border-gray-200 dark:border-gray-700 align-top min-w-22.5">
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
    {shifts.length === 0 && (
      <div className="py-10 text-center border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No shifts were generated for this week.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check that open days have forecasts and active shift templates with minimum or maximum coverage.</p>
      </div>
    )}
  </div>
)

function ScheduleGrid({ role, isGenerated, setIsGenerated, isPublished, setIsPublished, setPublishedWeek, onScheduleChanged }) {
  const view = 'employee'
  const [weekStart, setWeekStart] = useState(nextWeekStart())
  const [showModal, setShowModal] = useState(false)
  const [showUnpublishModal, setShowUnpublishModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(nextWeekStart())
  const [schedule, setSchedule] = useState(null)
  const [error, setError] = useState('')
  const [averagePricePerHead, setAveragePricePerHead] = useState('')
  const [forecasts, setForecasts] = useState([])
  const [jobCodes, setJobCodes] = useState([])
  const [staffingRules, setStaffingRules] = useState([])
  const [staffingForm, setStaffingForm] = useState(createEmptyStaffingForm())
  const [staffingRuleToDelete, setStaffingRuleToDelete] = useState(null)

  const shifts = scheduleToShifts(schedule)

  const buildForecastRows = useCallback((startDate, existingForecasts = []) => {
    const existingByDate = new Map(existingForecasts.map(forecast => [forecast.date, forecast]))
    const start = new Date(`${startDate}T00:00:00`)

    return Array.from({ length: 7 }, (_, index) => {
      const date = toIsoDate(addDays(start, index))
      const existing = existingByDate.get(date)
      return {
        date,
        dayName: dayNames[new Date(`${date}T00:00:00`).getDay()],
        open: existing?.open ?? true,
        projectedSales: existing?.projectedSales?.toString() ?? '',
        projectedHeads: existing?.projectedHeads ?? null,
      }
    })
  }, [])

  const loadGenerationInputs = useCallback(async (startDate) => {
    if (role !== 'manager') return

    try {
      const [settings, weekForecasts, codes, rules] = await Promise.all([
        restaurantSettingsApi.get(),
        forecastsApi.getWeek(startDate),
        jobCodesApi.list(),
        staffingRulesApi.list(),
      ])
      setAveragePricePerHead(settings.averagePricePerHead?.toString() ?? '')
      setForecasts(buildForecastRows(startDate, weekForecasts))
      setJobCodes(codes)
      setStaffingRules(rules)
      setStaffingForm(current => ({
        ...current,
        jobCodeId: current.jobCodeId || codes[0]?.id?.toString() || '',
      }))
    } catch (err) {
      setError(err.message || 'Unable to load generation inputs.')
      setForecasts(buildForecastRows(startDate))
    }
  }, [buildForecastRows, role])

  const loadSchedule = useCallback(async (startDate) => {
    setIsLoading(true)
    setError('')
    try {
      const nextSchedule = role === 'employee'
        ? await schedulesApi.getPublishedWeek(startDate)
        : await schedulesApi.getWeek(startDate)
      setSchedule(nextSchedule)
      setIsGenerated(true)
      setIsPublished(nextSchedule.status === 'PUBLISHED')
      if (nextSchedule.status === 'PUBLISHED') setPublishedWeek(formatWeekRange(nextSchedule.startDate))
    } catch (err) {
      if (err.status !== 404) setError(err.message || 'Unable to load schedule.')
      setSchedule(null)
      setIsGenerated(false)
      setIsPublished(false)
    } finally {
      setIsLoading(false)
    }
  }, [role, setIsGenerated, setIsPublished, setPublishedWeek])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      await restaurantSettingsApi.update({
        averagePricePerHead: Number(averagePricePerHead),
      })
      await Promise.all(forecasts.map(forecast => forecastsApi.upsert(forecast.date, {
        projectedSales: forecast.open ? Number(forecast.projectedSales || 0) : 0,
        open: forecast.open,
      })))
      const generated = await schedulesApi.generate(selectedWeek)
      setSchedule(generated)
      setWeekStart(generated.startDate)
      setIsPublished(false)
      setIsGenerated(true)
      onScheduleChanged?.()
    } catch (err) {
      setError(err.message || 'Unable to generate schedule.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveStaffingRule = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const saved = await staffingRulesApi.upsert({
        id: staffingForm.id,
        dayOfWeek: staffingForm.dayOfWeek,
        jobCodeId: Number(staffingForm.jobCodeId),
        headsPerEmployee: staffingForm.headsPerEmployee === '' ? null : Number(staffingForm.headsPerEmployee),
      })
      setStaffingRules(current => [
        ...current.filter(rule => rule.id !== saved.id),
        saved,
      ])
      setStaffingForm(createEmptyStaffingForm(saved.jobCodeId?.toString() || staffingForm.jobCodeId))
    } catch (err) {
      setError(err.message || 'Unable to save staffing rule.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStaffingRule = (rule) => {
    setError('')
    setStaffingForm({
      id: rule.id,
      dayOfWeek: rule.dayOfWeek,
      jobCodeId: rule.jobCodeId?.toString() || '',
      headsPerEmployee: rule.headsPerEmployee?.toString() || '',
    })
  }

  const handleCancelStaffingRuleEdit = () => {
    setStaffingForm(createEmptyStaffingForm(jobCodes[0]?.id?.toString() || ''))
  }

  const handleDeleteStaffingRule = async () => {
    if (!staffingRuleToDelete) return

    setIsLoading(true)
    setError('')

    try {
      await staffingRulesApi.remove(staffingRuleToDelete.id)
      setStaffingRules(current => current.filter(rule => rule.id !== staffingRuleToDelete.id))
      if (staffingForm.id === staffingRuleToDelete.id) {
        handleCancelStaffingRuleEdit()
      }
      setStaffingRuleToDelete(null)
    } catch (err) {
      setError(err.message || 'Unable to delete staffing rule.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateForecast = (date, patch) => {
    setForecasts(current => current.map(forecast => (
      forecast.date === date ? { ...forecast, ...patch } : forecast
    )))
  }

  const handleRegenerateSetup = () => {
    const targetWeek = schedule?.startDate || weekStart
    setError('')
    setSelectedWeek(targetWeek)
    setWeekStart(targetWeek)
    setIsPublished(false)
    setIsGenerated(false)
    loadGenerationInputs(targetWeek)
  }

  const handleUnpublish = async () => {
    if (!schedule) return

    setIsLoading(true)
    setError('')

    try {
      const reopened = await schedulesApi.reopen(schedule.id)
      setSchedule(reopened)
      setIsPublished(false)
      setPublishedWeek('')
      setShowUnpublishModal(false)
      onScheduleChanged?.()
    } catch (err) {
      setError(err.message || 'Unable to unpublish schedule.')
    } finally {
      setIsLoading(false)
    }
  }

  const employees = [...new Set(shifts.map(shift => shift.employee))].sort()

  const roleOrder = ['Manager', 'Shift Lead', 'Cook', 'Host', 'Server', 'Bartender']
  const roles = [...new Set(shifts.map(shift => shift.role))].sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b))

  const goToWeek = (startDate) => {
    setWeekStart(startDate)
    setSelectedWeek(startDate)
  }

  const changeWeek = (days) => {
    const next = toIsoDate(addDays(new Date(`${weekStart}T00:00:00`), days))
    goToWeek(next)
  }

  useEffect(() => {
    loadSchedule(weekStart)
  }, [loadSchedule, weekStart])

  useEffect(() => {
    if (!isGenerated && role === 'manager') {
      loadGenerationInputs(selectedWeek)
    }
  }, [isGenerated, loadGenerationInputs, role, selectedWeek])

  return (
    <div className="max-w-7xl mx-auto">

      {/* Generate screen */}
      {!isGenerated && role === 'manager' && (
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Demand inputs</p>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Generate Schedule</h2>
            </div>
            <div className="w-72">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Week</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {getApiWeekOptions().map(week => (
                  <option key={week.value} value={week.value}>{week.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_24rem] gap-6 items-start">
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Daily Forecasts</h3>
                <div className="w-48">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg. price per head</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={averagePricePerHead}
                    onChange={event => setAveragePricePerHead(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Day</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Open</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Projected sales</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Projected heads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map(forecast => {
                      const heads = forecast.open && averagePricePerHead
                        ? Math.ceil(Number(forecast.projectedSales || 0) / Number(averagePricePerHead))
                        : 0
                      return (
                        <tr key={forecast.date}>
                          <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{forecast.dayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateLabel(forecast.date, { month: 'short', day: 'numeric' })}</p>
                          </td>
                          <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <input
                              type="checkbox"
                              checked={forecast.open}
                              onChange={event => updateForecast(forecast.date, { open: event.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={forecast.projectedSales}
                              disabled={!forecast.open}
                              onChange={event => updateForecast(forecast.date, { projectedSales: event.target.value })}
                              className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                            {heads}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Staffing Rules</h3>
              <form onSubmit={handleSaveStaffingRule} className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Day</label>
                  <select
                    value={staffingForm.dayOfWeek}
                    onChange={event => setStaffingForm(current => ({ ...current, dayOfWeek: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {dayCodes.map(day => <option key={day} value={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Job code</label>
                  <select
                    value={staffingForm.jobCodeId}
                    onChange={event => setStaffingForm(current => ({ ...current, jobCodeId: event.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select job code</option>
                    {jobCodes.map(jobCode => <option key={jobCode.id} value={jobCode.id}>{jobCode.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Heads / employee</label>
                  <input
                    type="number"
                    min="1"
                    value={staffingForm.headsPerEmployee}
                    onChange={event => setStaffingForm(current => ({ ...current, headsPerEmployee: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  {staffingForm.id && (
                    <button
                      type="button"
                      onClick={handleCancelStaffingRuleEdit}
                      disabled={isLoading}
                      className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !jobCodes.length}
                    className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
                  >
                    {staffingForm.id ? 'Update Staffing Rule' : 'Save Staffing Rule'}
                  </button>
                </div>
              </form>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {staffingRules.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No staffing rules have been saved.</p>
                ) : staffingRules
                  .slice()
                  .sort((a, b) => dayCodes.indexOf(a.dayOfWeek) - dayCodes.indexOf(b.dayOfWeek) || a.jobCodeRank - b.jobCodeRank)
                  .map(rule => (
                    <div key={rule.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.dayOfWeek.charAt(0) + rule.dayOfWeek.slice(1).toLowerCase()} · {rule.jobCodeName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {rule.headsPerEmployee ? `1 per ${rule.headsPerEmployee} heads` : 'Template minimums only'}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditStaffingRule(rule)}
                            className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffingRuleToDelete(rule)}
                            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Saving inputs and generating...</p>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!averagePricePerHead || forecasts.length === 0}
                className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
              >
                {schedule ? 'Regenerate Schedule' : 'Generate Schedule'}
              </button>
            )}
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-4">{error}</p>}
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
                onClick={() => changeWeek(-7)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Week of {formatWeekRange(weekStart)}</span>
              <button
                onClick={() => changeWeek(7)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                →
              </button>
            </div>

            {role === 'manager' && (
              <div className="flex items-center gap-3">
                {isPublished && (
                  <>
                    <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium">
                      ✓ Published
                    </span>
                    <button
                      onClick={() => setShowUnpublishModal(true)}
                      disabled={isLoading}
                      className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-sm font-semibold transition-colors"
                    >
                      Unpublish Schedule
                    </button>
                  </>
                )}
                {!isPublished && (
                  <>
                    <button
                      onClick={handleRegenerateSetup}
                      disabled={isLoading}
                      className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-sm font-semibold transition-colors"
                    >
                      Regenerate Schedule
                    </button>
                    <button
                      onClick={() => setShowModal(true)}
                      disabled={isLoading}
                      className="px-5 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-60 transition-colors"
                    >
                      Publish Schedule
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          {/*
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
          */}

          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
          {view === 'employee' && <EmployeeRowView employees={employees} shifts={shifts} />}
          {view === 'role' && <RoleRowView roles={roles} shifts={shifts} />}
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Publish Schedule?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will notify all employees of the schedule for the week of {formatWeekRange(schedule?.startDate || selectedWeek)}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!schedule) return
                  setIsLoading(true)
                  try {
                    const published = await schedulesApi.publish(schedule.id)
                    setSchedule(published)
                    setIsPublished(true)
                    setPublishedWeek(formatWeekRange(published.startDate))
                    setShowModal(false)
                    onScheduleChanged?.()
                  } catch (err) {
                    setError(err.message || 'Unable to publish schedule.')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnpublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Unpublish Schedule?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will move the schedule for {formatWeekRange(schedule?.startDate || selectedWeek)} back to draft so it can be edited or regenerated.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUnpublishModal(false)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors"
              >
                {isLoading ? 'Unpublishing...' : 'Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {staffingRuleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Staffing Rule?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will remove {staffingRuleToDelete.jobCodeName} demand rules for {staffingRuleToDelete.dayOfWeek.charAt(0) + staffingRuleToDelete.dayOfWeek.slice(1).toLowerCase()}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStaffingRuleToDelete(null)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaffingRule}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ScheduleGrid
