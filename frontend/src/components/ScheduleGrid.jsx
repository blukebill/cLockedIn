import { useCallback, useEffect, useState } from 'react'
import { days } from '../constants/days'
import { getJobCodeColor } from '../constants/roleColors'
import {
  availabilityApi,
  employeeJobCodesApi,
  employeesApi,
  forecastsApi,
  jobCodesApi,
  restaurantSettingsApi,
  schedulesApi,
  staffingRulesApi,
  timeOffRequestsApi,
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

const emptyShiftForm = {
  id: null,
  jobCodeId: '',
  employeeId: '',
  shiftDate: '',
  startTime: '09:00',
  endTime: '17:00',
}

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

const apiTimeToInput = (value) => value?.slice(0, 5) || ''

const dayCodeForDate = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return dayCodes[(date.getDay() + 6) % 7]
}

const overlaps = (firstStart, firstEnd, secondStart, secondEnd) => (
  firstStart < secondEnd && secondStart < firstEnd
)

const buildShiftWarnings = ({
  employeeId,
  jobCodeId,
  shiftDate,
  startTime,
  endTime,
  assignments,
  availability,
  timeOffRequests,
}) => {
  if (!employeeId) return []

  const numericEmployeeId = Number(employeeId)
  const numericJobCodeId = Number(jobCodeId)
  const warnings = []
  const hasJobCode = assignments.some(assignment =>
    Number(assignment.employeeId) === numericEmployeeId && Number(assignment.jobCodeId) === numericJobCodeId
  )

  if (!hasJobCode) {
    warnings.push('This employee is not assigned to the selected job code.')
  }

  const dayOfWeek = dayCodeForDate(shiftDate)
  const availabilityEntry = availability.find(entry =>
    Number(entry.employeeId) === numericEmployeeId && entry.dayOfWeek === dayOfWeek
  )
  const availableForShift = availabilityEntry?.available
    && apiTimeToInput(availabilityEntry.startTime) <= startTime
    && apiTimeToInput(availabilityEntry.endTime) >= endTime

  if (!availableForShift) {
    warnings.push('This employee is not available for the full shift time.')
  }

  const hasApprovedTimeOff = timeOffRequests.some(request =>
    Number(request.userId) === numericEmployeeId
    && request.status === 'APPROVED'
    && request.startDate <= shiftDate
    && request.endDate >= shiftDate
    && overlaps(apiTimeToInput(request.startTime), apiTimeToInput(request.endTime), startTime, endTime)
  )

  if (hasApprovedTimeOff) {
    warnings.push('This employee has approved time off during this shift.')
  }

  return warnings
}

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

const ManagerEditableSchedule = ({
  employees,
  shifts,
  rawShifts,
  weekStart,
  selectedShiftId,
  selectedCell,
  copiedShift,
  onSelectShift,
  onSelectCell,
  onEditShift,
  onCreateShift,
  onContextMenu,
  draggedShiftId,
  onDragShiftStart,
  onDragShiftEnd,
  onDropShift,
}) => {
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(`${weekStart}T00:00:00`)
    return toIsoDate(addDays(start, index))
  })
  const employeesWithUnassigned = [
    ...employees,
    { id: null, name: 'Unassigned' },
  ]

  const rawById = new Map(rawShifts.map(shift => [shift.id, shift]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
            {weekDates.map(date => (
              <th key={date} className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <div>{dayNames[new Date(`${date}T00:00:00`).getDay()]}</div>
                <div className="text-xs font-normal text-gray-400 dark:text-gray-500">{formatDateLabel(date, { month: 'short', day: 'numeric' })}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employeesWithUnassigned.map(employee => (
            <tr key={employee.id ?? 'unassigned'}>
              <td className="p-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                {employee.name}
              </td>
              {weekDates.map(date => {
                const cellShifts = shifts
                  .filter(shift => (
                    shift.shiftDate === date
                    && (employee.id == null ? shift.isUnassigned : Number(shift.employeeId) === Number(employee.id))
                  ))
                  .sort(sortShiftsByTime)
                const isSelectedCell = selectedCell?.employeeId === employee.id && selectedCell?.shiftDate === date
                const singleTargetShift = cellShifts.length === 1 ? rawById.get(cellShifts[0].id) : null
                const canDropShift = Boolean(draggedShiftId)
                  && (
                    cellShifts.length === 0
                    || (singleTargetShift && singleTargetShift.id !== draggedShiftId)
                  )
                return (
                  <td
                    key={date}
                    onClick={() => onSelectCell(employee.id, date)}
                    onContextMenu={event => onContextMenu(event, { type: 'cell', employeeId: employee.id, shiftDate: date })}
                    onDragOver={event => {
                      if (canDropShift) event.preventDefault()
                    }}
                    onDrop={event => {
                      if (!canDropShift) return
                      event.preventDefault()
                      onDropShift(employee.id, date, singleTargetShift)
                    }}
                    className={`p-1 border-b border-gray-200 dark:border-gray-700 align-top min-w-32 h-24 cursor-pointer ${isSelectedCell ? 'bg-green-50 dark:bg-green-900/20' : ''} ${canDropShift ? 'bg-green-50/60 dark:bg-green-900/10' : ''}`}
                  >
                    {cellShifts.map(shift => {
                      const rawShift = rawById.get(shift.id)
                      const isSelectedShift = selectedShiftId === shift.id
                      const isDraggedShift = draggedShiftId === shift.id
                      const canDropOnShift = Boolean(draggedShiftId) && draggedShiftId !== shift.id
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          draggable
                          onClick={event => {
                            event.stopPropagation()
                            onSelectShift(shift.id)
                          }}
                          onDragStart={event => {
                            event.stopPropagation()
                            event.dataTransfer.effectAllowed = 'move'
                            event.dataTransfer.setData('text/plain', shift.id.toString())
                            onDragShiftStart(rawShift)
                          }}
                          onDragEnd={onDragShiftEnd}
                          onDragOver={event => {
                            if (canDropOnShift) event.preventDefault()
                          }}
                          onDrop={event => {
                            if (!canDropOnShift) return
                            event.preventDefault()
                            event.stopPropagation()
                            onDropShift(employee.id, date, rawShift)
                          }}
                          onDoubleClick={event => {
                            event.stopPropagation()
                            onEditShift(rawShift)
                          }}
                          onContextMenu={event => onContextMenu(event, { type: 'shift', shift: rawShift })}
                          className={`block w-full text-left rounded text-white text-xs p-1.5 mb-1 last:mb-0 ring-offset-1 dark:ring-offset-gray-900 ${isSelectedShift ? 'ring-2 ring-gray-900 dark:ring-white' : ''} ${isDraggedShift ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: getJobCodeColor(shift) }}
                        >
                          <div className="font-medium">{shift.role}</div>
                          <div className="opacity-90">{shift.startTime} - {shift.endTime}</div>
                          {shift.isUnassigned && <div className="opacity-90">Unassigned</div>}
                        </button>
                      )
                    })}
                    {cellShifts.length === 0 && (
                      <div className="flex h-full min-h-16 items-center justify-center">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation()
                            onCreateShift(employee.id, date)
                          }}
                          className="h-8 w-8 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Create shift"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rawShifts.length === 0 && (
        <div className="py-10 text-center border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No shifts were generated for this week.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create shifts manually or go back to the generation setup.</p>
        </div>
      )}
      {copiedShift && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {copiedShift.cutSourceId ? 'Cut' : 'Copied'} {copiedShift.jobCodeName} shift, {apiTimeToInput(copiedShift.startTime)}-{apiTimeToInput(copiedShift.endTime)}.
        </p>
      )}
    </div>
  )
}

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
  const [teamMembers, setTeamMembers] = useState([])
  const [employeeAssignments, setEmployeeAssignments] = useState([])
  const [availabilityEntries, setAvailabilityEntries] = useState([])
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const [shiftForm, setShiftForm] = useState(emptyShiftForm)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [selectedShiftId, setSelectedShiftId] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [copiedShift, setCopiedShift] = useState(null)
  const [lastPastedShift, setLastPastedShift] = useState(null)
  const [draggedShift, setDraggedShift] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [pendingWarningAction, setPendingWarningAction] = useState(null)
  const [success, setSuccess] = useState('')

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

  const loadEditingInputs = useCallback(async () => {
    if (role !== 'manager') return

    try {
      const [employeeData, assignmentData, availabilityData, timeOffData, codes] = await Promise.all([
        employeesApi.list(),
        employeeJobCodesApi.list(),
        availabilityApi.list(),
        timeOffRequestsApi.listRestaurant(),
        jobCodesApi.list(),
      ])
      setTeamMembers(Array.isArray(employeeData) ? employeeData : [])
      setEmployeeAssignments(Array.isArray(assignmentData) ? assignmentData : [])
      setAvailabilityEntries(Array.isArray(availabilityData) ? availabilityData : [])
      setTimeOffRequests(Array.isArray(timeOffData) ? timeOffData : [])
      setJobCodes(Array.isArray(codes) ? codes : [])
    } catch (err) {
      setError(err.message || 'Unable to load schedule editing data.')
    }
  }, [role])

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

  const refreshScheduleAfterEdit = async () => {
    await loadSchedule(weekStart)
    onScheduleChanged?.()
  }

  const warningsForShiftForm = (form, label = '') => (
    buildShiftWarnings({
      employeeId: form.employeeId,
      jobCodeId: form.jobCodeId,
      shiftDate: form.shiftDate,
      startTime: form.startTime,
      endTime: form.endTime,
      assignments: employeeAssignments,
      availability: availabilityEntries,
      timeOffRequests,
    }).map(warning => label ? `${label}: ${warning}` : warning)
  )

  const runWithAssignmentWarnings = async (form, action) => {
    const warnings = warningsForShiftForm(form)

    if (warnings.length > 0) {
      setPendingWarningAction({
        warnings,
        action: () => action(true),
      })
      return
    }

    await action(false)
  }

  const runWithMultipleAssignmentWarnings = async (forms, action) => {
    const warnings = forms.flatMap(({ form, label }) => warningsForShiftForm(form, label))

    if (warnings.length > 0) {
      setPendingWarningAction({
        warnings,
        action: () => action(true),
      })
      return
    }

    await action(false)
  }

  const openCreateShift = (employeeId = null, shiftDate = weekStart) => {
    setError('')
    setSuccess('')
    setContextMenu(null)
    setShiftForm({
      ...emptyShiftForm,
      jobCodeId: jobCodes[0]?.id?.toString() || '',
      employeeId: employeeId == null ? '' : employeeId.toString(),
      shiftDate,
    })
    setShowShiftModal(true)
  }

  const openEditShift = (shift) => {
    if (!shift) return

    setError('')
    setSuccess('')
    setContextMenu(null)
    setSelectedShiftId(shift.id)
    setShiftForm({
      id: shift.id,
      jobCodeId: shift.jobCodeId?.toString() || '',
      employeeId: shift.employeeId?.toString() || '',
      shiftDate: shift.shiftDate,
      startTime: apiTimeToInput(shift.startTime),
      endTime: apiTimeToInput(shift.endTime),
    })
    setShowShiftModal(true)
  }

  const saveShift = async (overrideConflicts = false) => {
    if (!schedule) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        jobCodeId: Number(shiftForm.jobCodeId),
        shiftDate: shiftForm.shiftDate,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        overrideConflicts,
      }
      if (shiftForm.employeeId) {
        payload.employeeId = Number(shiftForm.employeeId)
      }

      if (shiftForm.id) {
        await schedulesApi.updateShift(schedule.id, shiftForm.id, payload)
        if (!shiftForm.employeeId) {
          await schedulesApi.clearShiftAssignment(schedule.id, shiftForm.id)
        }
        setSuccess('Shift updated.')
      } else {
        await schedulesApi.createShift(schedule.id, {
          ...payload,
          employeeId: shiftForm.employeeId ? Number(shiftForm.employeeId) : null,
        })
        setSuccess('Shift created.')
      }

      setShowShiftModal(false)
      await refreshScheduleAfterEdit()
    } catch (err) {
      setError(err.message || 'Unable to save shift.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShiftSubmit = async (event) => {
    event.preventDefault()
    await runWithAssignmentWarnings(shiftForm, saveShift)
  }

  const deleteShift = async (shiftId) => {
    if (!schedule || !shiftId) return

    setIsLoading(true)
    setError('')
    setSuccess('')
    setContextMenu(null)

    try {
      await schedulesApi.deleteShift(schedule.id, shiftId)
      setSelectedShiftId(null)
      setShowShiftModal(false)
      setSuccess('Shift deleted.')
      await refreshScheduleAfterEdit()
    } catch (err) {
      setError(err.message || 'Unable to delete shift.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyShift = (shift) => {
    if (!shift) return

    setCopiedShift({ ...shift, cutSourceId: null })
    setSelectedShiftId(shift.id)
    setContextMenu(null)
    setSuccess('Shift copied.')
  }

  const cutShift = (shift) => {
    if (!shift) return

    setCopiedShift({ ...shift, cutSourceId: shift.id })
    setSelectedShiftId(shift.id)
    setContextMenu(null)
    setSuccess('Shift cut. Select a destination and paste to move it.')
  }

  const pasteShift = async (employeeId = selectedCell?.employeeId, shiftDate = selectedCell?.shiftDate) => {
    if (!schedule || !copiedShift || !shiftDate) return

    const nextForm = {
      id: null,
      jobCodeId: copiedShift.jobCodeId?.toString() || '',
      employeeId: employeeId == null ? '' : employeeId.toString(),
      shiftDate,
      startTime: apiTimeToInput(copiedShift.startTime),
      endTime: apiTimeToInput(copiedShift.endTime),
    }

    setContextMenu(null)
    setShiftForm(nextForm)
    await runWithAssignmentWarnings(nextForm, async (overrideConflicts) => {
      setIsLoading(true)
      setError('')
      setSuccess('')
      try {
        const pasted = await schedulesApi.createShift(schedule.id, {
          jobCodeId: Number(nextForm.jobCodeId),
          employeeId: nextForm.employeeId ? Number(nextForm.employeeId) : null,
          shiftDate: nextForm.shiftDate,
          startTime: nextForm.startTime,
          endTime: nextForm.endTime,
          overrideConflicts,
        })
        if (copiedShift.cutSourceId) {
          await schedulesApi.deleteShift(schedule.id, copiedShift.cutSourceId)
          setCopiedShift(null)
        }
        setLastPastedShift({
          scheduleId: schedule.id,
          shiftId: pasted.id,
          restoredShift: copiedShift.cutSourceId ? copiedShift : null,
        })
        setSelectedShiftId(pasted.id)
        setSuccess(copiedShift.cutSourceId ? 'Shift moved.' : 'Shift pasted.')
        await refreshScheduleAfterEdit()
      } catch (err) {
        setError(err.message || (copiedShift.cutSourceId ? 'Unable to move shift.' : 'Unable to paste shift.'))
      } finally {
        setIsLoading(false)
      }
    })
  }

  const moveShift = async (shift, employeeId, shiftDate) => {
    if (!schedule || !shift || !shiftDate) return
    if (shift.employeeId === employeeId && shift.shiftDate === shiftDate) return

    const nextForm = {
      id: shift.id,
      jobCodeId: shift.jobCodeId?.toString() || '',
      employeeId: employeeId == null ? '' : employeeId.toString(),
      shiftDate,
      startTime: apiTimeToInput(shift.startTime),
      endTime: apiTimeToInput(shift.endTime),
    }

    setContextMenu(null)
    setShiftForm(nextForm)
    await runWithAssignmentWarnings(nextForm, async (overrideConflicts) => {
      setIsLoading(true)
      setError('')
      setSuccess('')
      try {
        const payload = {
          jobCodeId: Number(nextForm.jobCodeId),
          shiftDate: nextForm.shiftDate,
          startTime: nextForm.startTime,
          endTime: nextForm.endTime,
          overrideConflicts,
        }
        if (nextForm.employeeId) {
          payload.employeeId = Number(nextForm.employeeId)
        }

        await schedulesApi.updateShift(schedule.id, shift.id, payload)
        if (!nextForm.employeeId) {
          await schedulesApi.clearShiftAssignment(schedule.id, shift.id)
        }
        setSelectedShiftId(shift.id)
        setSelectedCell({ employeeId, shiftDate })
        setSuccess('Shift moved.')
        await refreshScheduleAfterEdit()
      } catch (err) {
        setError(err.message || 'Unable to move shift.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  const swapShifts = async (sourceShift, targetShift, targetEmployeeId, targetShiftDate) => {
    if (!schedule || !sourceShift || !targetShift || sourceShift.id === targetShift.id) return

    const sourceEmployeeId = sourceShift.employeeId == null ? '' : sourceShift.employeeId.toString()
    const sourceShiftDate = sourceShift.shiftDate
    const sourceForm = {
      id: sourceShift.id,
      jobCodeId: sourceShift.jobCodeId?.toString() || '',
      employeeId: targetEmployeeId == null ? '' : targetEmployeeId.toString(),
      shiftDate: targetShiftDate,
      startTime: apiTimeToInput(sourceShift.startTime),
      endTime: apiTimeToInput(sourceShift.endTime),
    }
    const targetForm = {
      id: targetShift.id,
      jobCodeId: targetShift.jobCodeId?.toString() || '',
      employeeId: sourceEmployeeId,
      shiftDate: sourceShiftDate,
      startTime: apiTimeToInput(targetShift.startTime),
      endTime: apiTimeToInput(targetShift.endTime),
    }

    await runWithMultipleAssignmentWarnings([
      { form: sourceForm, label: `${sourceShift.jobCodeName || 'Dragged shift'} reassignment` },
      { form: targetForm, label: `${targetShift.jobCodeName || 'Target shift'} reassignment` },
    ], async (overrideConflicts) => {
      setIsLoading(true)
      setError('')
      setSuccess('')
      try {
        const swapped = await schedulesApi.swapShifts(schedule.id, sourceShift.id, targetShift.id, overrideConflicts)
        setSchedule(swapped)
        setSelectedShiftId(sourceShift.id)
        setSelectedCell({ employeeId: targetEmployeeId, shiftDate: targetShiftDate })
        setSuccess('Shifts swapped.')
        onScheduleChanged?.()
      } catch (err) {
        setError(err.message || 'Unable to swap shifts.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  const undoLastPastedShift = async () => {
    if (!lastPastedShift) return

    setIsLoading(true)
    setError('')
    setSuccess('')
    setContextMenu(null)

    try {
      await schedulesApi.deleteShift(lastPastedShift.scheduleId, lastPastedShift.shiftId)
      if (lastPastedShift.restoredShift) {
        const restoredShift = lastPastedShift.restoredShift
        await schedulesApi.createShift(lastPastedShift.scheduleId, {
          jobCodeId: Number(restoredShift.jobCodeId),
          employeeId: restoredShift.employeeId ? Number(restoredShift.employeeId) : null,
          shiftDate: restoredShift.shiftDate,
          startTime: apiTimeToInput(restoredShift.startTime),
          endTime: apiTimeToInput(restoredShift.endTime),
          overrideConflicts: true,
        })
      }
      setLastPastedShift(null)
      setSelectedShiftId(null)
      setSuccess(lastPastedShift.restoredShift ? 'Moved shift undone.' : 'Pasted shift undone.')
      await refreshScheduleAfterEdit()
    } catch (err) {
      setLastPastedShift(null)
      setError(err.message || 'Unable to undo pasted shift.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContextMenu = (event, nextContextMenu) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      ...nextContextMenu,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleDragShiftStart = (shift) => {
    if (!shift) return

    setDraggedShift(shift)
    setSelectedShiftId(shift.id)
    setContextMenu(null)
  }

  const handleDropShift = async (employeeId, shiftDate, targetShift = null) => {
    if (!draggedShift) return

    const targetShifts = scheduleShifts.filter(shift => (
      shift.shiftDate === shiftDate
      && (employeeId == null ? !shift.employeeId : Number(shift.employeeId) === Number(employeeId))
      && shift.id !== draggedShift.id
    ))
    const shiftToMove = draggedShift
    const shiftToSwap = targetShift || (targetShifts.length === 1 ? targetShifts[0] : null)

    setDraggedShift(null)
    if (shiftToSwap) {
      await swapShifts(shiftToMove, shiftToSwap, employeeId, shiftDate)
      return
    }
    if (targetShifts.length > 0) return

    await moveShift(shiftToMove, employeeId, shiftDate)
  }

  const copyWeekToNextWeek = async () => {
    if (!schedule) return

    const targetStartDate = toIsoDate(addDays(new Date(`${schedule.startDate}T00:00:00`), 7))
    if (!window.confirm(`Copy this schedule to ${formatWeekRange(targetStartDate)}? Any draft shifts already there will be replaced.`)) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const copied = await schedulesApi.copy(schedule.id, targetStartDate)
      setSchedule(copied)
      setWeekStart(copied.startDate)
      setSelectedWeek(copied.startDate)
      setIsGenerated(true)
      setIsPublished(false)
      setSuccess('Schedule copied to next week.')
      onScheduleChanged?.()
    } catch (err) {
      setError(err.message || 'Unable to copy schedule.')
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleShifts = schedule?.shifts || []
  const employees = [...new Set(shifts.map(shift => shift.employee))].sort()
  const sortedTeamMembers = [...teamMembers].sort((a, b) => a.name.localeCompare(b.name))

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

  useEffect(() => {
    if (isGenerated && role === 'manager') {
      loadEditingInputs()
    }
  }, [isGenerated, loadEditingInputs, role])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
      const handleKeyDown = (event) => {
        if (role !== 'manager' || isPublished || showShiftModal || pendingWarningAction) return

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        if (lastPastedShift) {
          event.preventDefault()
          undoLastPastedShift()
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        const selectedShift = scheduleShifts.find(shift => shift.id === selectedShiftId)
        if (selectedShift) {
          event.preventDefault()
          copyShift(selectedShift)
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') {
        const selectedShift = scheduleShifts.find(shift => shift.id === selectedShiftId)
        if (selectedShift) {
          event.preventDefault()
          cutShift(selectedShift)
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        if (copiedShift && selectedCell) {
          event.preventDefault()
          pasteShift(selectedCell.employeeId, selectedCell.shiftDate)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // Keyboard paste/undo intentionally call the latest helpers from the current render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copiedShift, isPublished, lastPastedShift, pendingWarningAction, role, scheduleShifts, selectedCell, selectedShiftId, showShiftModal])

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
                      onClick={() => openCreateShift(null, weekStart)}
                      disabled={isLoading}
                      className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-sm font-semibold transition-colors"
                    >
                      New Shift
                    </button>
                    <button
                      onClick={copyWeekToNextWeek}
                      disabled={isLoading || !schedule}
                      className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-sm font-semibold transition-colors"
                    >
                      Copy to Next Week
                    </button>
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
          {success && <p className="text-sm text-green-700 dark:text-green-400 mb-4">{success}</p>}
          {view === 'employee' && role === 'manager' && !isPublished && (
            <ManagerEditableSchedule
              employees={sortedTeamMembers}
              shifts={shifts}
              rawShifts={scheduleShifts}
              weekStart={weekStart}
              selectedShiftId={selectedShiftId}
              selectedCell={selectedCell}
              copiedShift={copiedShift}
              onSelectShift={setSelectedShiftId}
              onSelectCell={(employeeId, shiftDate) => setSelectedCell({ employeeId, shiftDate })}
              onEditShift={openEditShift}
              onCreateShift={openCreateShift}
              onContextMenu={handleContextMenu}
              draggedShiftId={draggedShift?.id || null}
              onDragShiftStart={handleDragShiftStart}
              onDragShiftEnd={() => setDraggedShift(null)}
              onDropShift={handleDropShift}
            />
          )}
          {view === 'employee' && (role !== 'manager' || isPublished) && <EmployeeRowView employees={employees} shifts={shifts} />}
          {view === 'role' && <RoleRowView roles={roles} shifts={shifts} />}
        </div>
      )}

      {contextMenu && role === 'manager' && !isPublished && (
        <div
          className="fixed z-50 min-w-40 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          {contextMenu.type === 'shift' && (
            <>
              <button
                type="button"
                onClick={() => openEditShift(contextMenu.shift)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => copyShift(contextMenu.shift)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => cutShift(contextMenu.shift)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cut
              </button>
              <button
                type="button"
                onClick={() => deleteShift(contextMenu.shift?.id)}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </>
          )}
          {contextMenu.type === 'cell' && (
            <>
              <button
                type="button"
                onClick={() => openCreateShift(contextMenu.employeeId, contextMenu.shiftDate)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                New Shift
              </button>
              <button
                type="button"
                disabled={!copiedShift}
                onClick={() => pasteShift(contextMenu.employeeId, contextMenu.shiftDate)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
              >
                Paste
              </button>
            </>
          )}
        </div>
      )}

      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {shiftForm.id ? 'Edit Shift' : 'Create Shift'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDateLabel(shiftForm.shiftDate || weekStart)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Job code</label>
                  <select
                    required
                    value={shiftForm.jobCodeId}
                    onChange={event => setShiftForm(current => ({ ...current, jobCodeId: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select job code</option>
                    {jobCodes.map(jobCode => <option key={jobCode.id} value={jobCode.id}>{jobCode.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Employee</label>
                  <select
                    value={shiftForm.employeeId}
                    onChange={event => setShiftForm(current => ({ ...current, employeeId: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Unassigned</option>
                    {sortedTeamMembers.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={shiftForm.shiftDate}
                    onChange={event => setShiftForm(current => ({ ...current, shiftDate: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Start</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={event => setShiftForm(current => ({ ...current, startTime: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">End</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={event => setShiftForm(current => ({ ...current, endTime: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <div>
                  {shiftForm.id && (
                    <button
                      type="button"
                      onClick={() => deleteShift(shiftForm.id)}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowShiftModal(false)}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingWarningAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Assignment Warning</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Review these issues before assigning the shift.
            </p>
            <ul className="space-y-2 mb-6">
              {pendingWarningAction.warnings.map(warning => (
                <li key={warning} className="text-sm text-gray-700 dark:text-gray-200">• {warning}</li>
              ))}
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingWarningAction(null)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingWarningAction.action
                  setPendingWarningAction(null)
                  await action()
                }}
                className="px-5 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold transition-colors"
              >
                Override
              </button>
            </div>
          </div>
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
