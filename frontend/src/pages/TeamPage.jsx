import { useEffect, useMemo, useState } from 'react'
import {
  availabilityApi,
  employeeJobCodesApi,
  employeeRolePrioritiesApi,
  employeesApi,
  jobCodesApi,
  preferredShiftAssignmentsApi,
  shiftTemplatesApi,
} from '../services/api'

const dayOptions = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const emptyEmployeeForm = {
  name: '',
  email: '',
  password: '',
}

const emptyJobCodeForm = {
  name: '',
  rank: '',
}

const emptyAssignmentForm = {
  employeeId: '',
  jobCodeId: '',
}

const emptyPriorityForm = {
  id: null,
  employeeId: '',
  jobCodeId: '',
  priority: '0',
}

const emptyPreferredShiftForm = {
  employeeId: '',
  shiftTemplateId: '',
}

const priorityGuide = [
  { value: '0', label: 'Strongest preference', detail: 'Use when this employee should get this role whenever availability allows.' },
  { value: '250', label: 'Preferred', detail: 'Use when this employee should usually be chosen for this role.' },
  { value: '500', label: 'Good fit', detail: 'Use for a normal positive preference.' },
  { value: '1000', label: 'Default', detail: 'Same as having no priority set.' },
  { value: '1500+', label: 'Last choice', detail: 'Use when this employee should be scheduled after other eligible employees.' },
]

const emptyTemplateForm = {
  jobCodeId: '',
  days: ['MONDAY'],
  name: '',
  startTime: '10:00',
  endTime: '16:00',
  active: true,
}

const tabs = [
  { id: 'employees', label: 'Employees' },
  { id: 'availability', label: 'Availability' },
  { id: 'jobCodes', label: 'Job Codes' },
  { id: 'assignments', label: 'Role Assignments' },
  { id: 'priorities', label: 'Priorities' },
  { id: 'templates', label: 'Shift Templates' },
  { id: 'coverage', label: 'Coverage' },
]

function fieldError(err, fallback) {
  const fields = err.details?.fields
  return fields ? Object.values(fields)[0] : err.message || fallback
}

function formatDay(day) {
  return day
    .toLowerCase()
    .replace(/^\w/, letter => letter.toUpperCase())
}

function formatTime(value) {
  if (!value) return ''
  const [hoursPart, minutesPart] = value.split(':')
  let hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function buildAvailabilityRows(entries = []) {
  const byDay = new Map(entries.map(entry => [entry.dayOfWeek, entry]))

  return dayOptions.map(day => {
    const entry = byDay.get(day)
    return {
      dayOfWeek: day,
      available: entry?.available ?? false,
      startTime: entry?.startTime?.slice(0, 5) ?? '09:00',
      endTime: entry?.endTime?.slice(0, 5) ?? '17:00',
    }
  })
}

function formatTemplateLabel(template) {
  return `${formatDay(template.dayOfWeek)} - ${template.name} (${template.jobCodeName}, ${formatTime(template.startTime)}-${formatTime(template.endTime)})`
}

function SectionShell({ title, actionTitle, children, action }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-6 items-start">
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        {children}
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{actionTitle}</h2>
        {action}
      </section>
    </div>
  )
}

function TextInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

function SelectInput({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {children}
      </select>
    </div>
  )
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-70 text-gray-700 dark:text-gray-100 font-semibold text-sm transition-colors"
    >
      {children}
    </button>
  )
}

function DangerButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
    >
      {children}
    </button>
  )
}

function TeamPage({ role }) {
  const [activeTab, setActiveTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [jobCodes, setJobCodes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [rolePriorities, setRolePriorities] = useState([])
  const [preferredShiftAssignments, setPreferredShiftAssignments] = useState([])
  const [shiftTemplates, setShiftTemplates] = useState([])
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm)
  const [jobCodeForm, setJobCodeForm] = useState(emptyJobCodeForm)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm)
  const [priorityForm, setPriorityForm] = useState(emptyPriorityForm)
  const [preferredShiftForm, setPreferredShiftForm] = useState(emptyPreferredShiftForm)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [jobCodeToDelete, setJobCodeToDelete] = useState(null)
  const [priorityToDelete, setPriorityToDelete] = useState(null)
  const [coverageDrafts, setCoverageDrafts] = useState({})
  const [availabilityEmployeeId, setAvailabilityEmployeeId] = useState('')
  const [availabilityRows, setAvailabilityRows] = useState(buildAvailabilityRows())
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(() => role === 'manager')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (role !== 'manager') return

    Promise.all([
      employeesApi.list(),
      jobCodesApi.list(),
      employeeJobCodesApi.list(),
      employeeRolePrioritiesApi.list(),
      preferredShiftAssignmentsApi.list(),
      shiftTemplatesApi.list(),
    ])
      .then(([employeeData, jobCodeData, assignmentData, priorityData, preferredShiftData, templateData]) => {
        setEmployees(asArray(employeeData))
        setJobCodes(asArray(jobCodeData))
        setAssignments(asArray(assignmentData))
        setRolePriorities(asArray(priorityData))
        setPreferredShiftAssignments(asArray(preferredShiftData))
        setShiftTemplates(asArray(templateData))
        setAvailabilityEmployeeId(current => current || asArray(employeeData)[0]?.id?.toString() || '')
      })
      .catch(err => setError(err.message || 'Unable to load team setup.'))
      .finally(() => setIsLoading(false))
  }, [role])

  useEffect(() => {
    if (role !== 'manager' || !availabilityEmployeeId) return

    setIsAvailabilityLoading(true)
    setError('')

    availabilityApi.listEmployee(availabilityEmployeeId)
      .then(data => setAvailabilityRows(buildAvailabilityRows(data)))
      .catch(err => setError(err.message || 'Unable to load availability.'))
      .finally(() => setIsAvailabilityLoading(false))
  }, [availabilityEmployeeId, role])

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])

  const sortedJobCodes = useMemo(() => {
    return [...jobCodes].sort((a, b) => a.rank - b.rank)
  }, [jobCodes])

  const sortedTemplates = useMemo(() => {
    return [...shiftTemplates].sort((a, b) => {
      const dayDiff = dayOptions.indexOf(a.dayOfWeek) - dayOptions.indexOf(b.dayOfWeek)
      if (dayDiff !== 0) return dayDiff
      return a.startTime.localeCompare(b.startTime)
    })
  }, [shiftTemplates])

  const sortedRolePriorities = useMemo(() => {
    const employeeNameById = new Map(employees.map(employee => [employee.id, employee.name]))
    const jobCodeById = new Map(jobCodes.map(jobCode => [jobCode.id, jobCode]))

    return asArray(rolePriorities)
      .map(priority => {
        const jobCode = jobCodeById.get(priority.jobCodeId)

        return {
          ...priority,
          id: priority.id ?? `${priority.employeeId}-${priority.jobCodeId}`,
          employeeName: priority.employeeName || employeeNameById.get(priority.employeeId) || 'Unknown employee',
          jobCodeName: priority.jobCodeName || jobCode?.name || 'Unknown job code',
          jobCodeRank: priority.jobCodeRank ?? jobCode?.rank ?? Number.MAX_SAFE_INTEGER,
          priority: priority.priority ?? 1000,
        }
      })
      .sort((a, b) => (
        a.employeeName.localeCompare(b.employeeName)
        || Number(a.jobCodeRank) - Number(b.jobCodeRank)
        || Number(a.priority) - Number(b.priority)
      ))
  }, [employees, jobCodes, rolePriorities])

  const sortedPreferredShiftAssignments = useMemo(() => {
    const employeeNameById = new Map(employees.map(employee => [employee.id, employee.name]))
    const templateById = new Map(shiftTemplates.map(template => [template.id, template]))

    return asArray(preferredShiftAssignments)
      .map(assignment => {
        const template = templateById.get(assignment.shiftTemplateId)

        return {
          ...assignment,
          id: assignment.id ?? `${assignment.employeeId}-${assignment.shiftTemplateId}`,
          employeeName: assignment.employeeName || employeeNameById.get(assignment.employeeId) || 'Unknown employee',
          shiftTemplateName: assignment.shiftTemplateName || template?.name || 'Unknown shift',
          jobCodeName: assignment.jobCodeName || template?.jobCodeName || 'Unknown job code',
          jobCodeRank: assignment.jobCodeRank ?? template?.jobCodeRank ?? Number.MAX_SAFE_INTEGER,
          dayOfWeek: assignment.dayOfWeek || template?.dayOfWeek || 'MONDAY',
          startTime: assignment.startTime || template?.startTime || '00:00',
          endTime: assignment.endTime || template?.endTime || '00:00',
        }
      })
      .sort((a, b) => (
        dayOptions.indexOf(a.dayOfWeek) - dayOptions.indexOf(b.dayOfWeek)
        || a.startTime.localeCompare(b.startTime)
        || Number(a.jobCodeRank) - Number(b.jobCodeRank)
        || a.employeeName.localeCompare(b.employeeName)
      ))
  }, [employees, preferredShiftAssignments, shiftTemplates])

  const coverageRows = useMemo(() => {
    return sortedTemplates.map(template => ({
      ...template,
      minEmployees: coverageDrafts[template.id]?.minEmployees ?? String(template.minEmployees),
      maxEmployees: coverageDrafts[template.id]?.maxEmployees ?? String(template.maxEmployees),
    }))
  }, [coverageDrafts, sortedTemplates])

  const resetMessages = () => {
    setError('')
    setSuccess('')
  }

  const refreshJobCodeDependentState = async () => {
    const [jobCodeData, assignmentData, priorityData, preferredShiftData, templateData] = await Promise.all([
      jobCodesApi.list(),
      employeeJobCodesApi.list(),
      employeeRolePrioritiesApi.list(),
      preferredShiftAssignmentsApi.list(),
      shiftTemplatesApi.list(),
    ])
    setJobCodes(asArray(jobCodeData))
    setAssignments(asArray(assignmentData))
    setRolePriorities(asArray(priorityData))
    setPreferredShiftAssignments(asArray(preferredShiftData))
    setShiftTemplates(asArray(templateData))
  }

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const created = await employeesApi.create({
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim(),
        password: employeeForm.password,
      })
      setEmployees(current => [...current, created])
      setEmployeeForm(emptyEmployeeForm)
      setSuccess(`${created.name} was added to the team.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to add employee.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setIsSaving(true)
    resetMessages()

    try {
      await employeesApi.remove(employeeToDelete.id)
      setEmployees(current => current.filter(employee => employee.id !== employeeToDelete.id))
      setAssignments(current => current.filter(assignment => assignment.employeeId !== employeeToDelete.id))
      setRolePriorities(current => current.filter(priority => priority.employeeId !== employeeToDelete.id))
      setPreferredShiftAssignments(current => current.filter(assignment => assignment.employeeId !== employeeToDelete.id))
      if (availabilityEmployeeId === employeeToDelete.id.toString()) {
        const nextEmployee = employees.find(employee => employee.id !== employeeToDelete.id)
        setAvailabilityEmployeeId(nextEmployee?.id?.toString() || '')
        setAvailabilityRows(buildAvailabilityRows())
      }
      setSuccess(`${employeeToDelete.name} was removed from the team.`)
      setEmployeeToDelete(null)
    } catch (err) {
      setError(fieldError(err, 'Unable to remove employee.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleProtectedEmployee = async (employee) => {
    setIsSaving(true)
    resetMessages()

    try {
      const updated = await employeesApi.update(employee.id, {
        protectedEmployee: !employee.protectedEmployee,
      })
      setEmployees(current => current.map(item => (
        item.id === employee.id ? updated : item
      )))
      setSuccess(`${updated.name} is now ${updated.protectedEmployee ? 'protected' : 'standard'}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to update protected employee status.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleJobCodeSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const saved = await jobCodesApi.upsert({
        name: jobCodeForm.name.trim(),
        rank: Number(jobCodeForm.rank),
      })
      await refreshJobCodeDependentState()
      setJobCodeForm(emptyJobCodeForm)
      setSuccess(`${saved.name} was saved as a job code.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save job code.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteJobCode = async () => {
    if (!jobCodeToDelete) return

    setIsSaving(true)
    resetMessages()

    try {
      await jobCodesApi.remove(jobCodeToDelete.id)
      const removedTemplateIds = new Set(
        shiftTemplates
          .filter(template => template.jobCodeId === jobCodeToDelete.id)
          .map(template => template.id)
      )
      await refreshJobCodeDependentState()
      setCoverageDrafts(drafts => Object.fromEntries(
        Object.entries(drafts).filter(([templateId]) => !removedTemplateIds.has(Number(templateId)))
      ))
      setAssignmentForm(current => (
        current.jobCodeId === jobCodeToDelete.id.toString()
          ? { ...current, jobCodeId: '' }
          : current
      ))
      setPriorityForm(current => (
        current.jobCodeId === jobCodeToDelete.id.toString()
          ? { ...current, jobCodeId: '' }
          : current
      ))
      setTemplateForm(current => (
        current.jobCodeId === jobCodeToDelete.id.toString()
          ? { ...current, jobCodeId: '' }
          : current
      ))
      setPreferredShiftForm(current => (
        removedTemplateIds.has(Number(current.shiftTemplateId))
          ? { ...current, shiftTemplateId: '' }
          : current
      ))
      setSuccess(`${jobCodeToDelete.name} was removed from the job code hierarchy.`)
      setJobCodeToDelete(null)
    } catch (err) {
      setError(fieldError(err, 'Unable to remove job code.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const saved = await employeeJobCodesApi.assign(
        Number(assignmentForm.employeeId),
        Number(assignmentForm.jobCodeId)
      )
      setAssignments(current => [
        ...current.filter(assignment => assignment.id !== saved.id),
        saved,
      ])
      setAssignmentForm(emptyAssignmentForm)
      setSuccess(`${saved.employeeName} can now work ${saved.jobCodeName}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to assign job code.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveAssignment = async (assignment) => {
    setIsSaving(true)
    resetMessages()

    try {
      await employeeJobCodesApi.remove(assignment.employeeId, assignment.jobCodeId)
      setAssignments(current => current.filter(item => item.id !== assignment.id))
      setSuccess(`${assignment.jobCodeName} was removed from ${assignment.employeeName}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to remove assignment.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrioritySubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const saved = await employeeRolePrioritiesApi.upsert({
        id: priorityForm.id,
        employeeId: Number(priorityForm.employeeId),
        jobCodeId: Number(priorityForm.jobCodeId),
        priority: Number(priorityForm.priority),
      })
      setRolePriorities(current => [
        ...current.filter(priority => (
          priority.id !== saved.id
          && !(priority.employeeId === saved.employeeId && priority.jobCodeId === saved.jobCodeId)
        )),
        saved,
      ])
      setPriorityForm(emptyPriorityForm)
      setSuccess(`${saved.employeeName} priority for ${saved.jobCodeName} was saved.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save role priority.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditPriority = (priority) => {
    resetMessages()
    setPriorityForm({
      id: priority.id,
      employeeId: priority.employeeId?.toString() || '',
      jobCodeId: priority.jobCodeId?.toString() || '',
      priority: priority.priority?.toString() || '0',
    })
  }

  const handleCancelPriorityEdit = () => {
    setPriorityForm(emptyPriorityForm)
  }

  const handleDeletePriority = async () => {
    if (!priorityToDelete) return

    setIsSaving(true)
    resetMessages()

    try {
      await employeeRolePrioritiesApi.remove(priorityToDelete.id)
      setRolePriorities(current => current.filter(priority => priority.id !== priorityToDelete.id))
      if (priorityForm.id === priorityToDelete.id) {
        setPriorityForm(emptyPriorityForm)
      }
      setSuccess(`${priorityToDelete.employeeName} priority for ${priorityToDelete.jobCodeName} was removed.`)
      setPriorityToDelete(null)
    } catch (err) {
      setError(fieldError(err, 'Unable to remove role priority.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferredShiftSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const saved = await preferredShiftAssignmentsApi.upsert({
        employeeId: Number(preferredShiftForm.employeeId),
        shiftTemplateId: Number(preferredShiftForm.shiftTemplateId),
      })
      setPreferredShiftAssignments(current => [
        ...current.filter(assignment => (
          assignment.id !== saved.id
          && !(assignment.employeeId === saved.employeeId && assignment.shiftTemplateId === saved.shiftTemplateId)
        )),
        saved,
      ])
      setPreferredShiftForm(emptyPreferredShiftForm)
      setSuccess(`${saved.employeeName} was assigned preferred access to ${saved.shiftTemplateName}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save preferred shift assignment.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePreferredShiftAssignment = async (assignment) => {
    setIsSaving(true)
    resetMessages()

    try {
      await preferredShiftAssignmentsApi.remove(assignment.id)
      setPreferredShiftAssignments(current => current.filter(item => item.id !== assignment.id))
      setSuccess(`${assignment.employeeName} was removed from ${assignment.shiftTemplateName}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to remove preferred shift assignment.'))
    } finally {
      setIsSaving(false)
    }
  }

  const updateAvailabilityRow = (dayOfWeek, patch) => {
    setAvailabilityRows(current => current.map(row => (
      row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row
    )))
  }

  const setOpenAvailability = () => {
    setAvailabilityRows(dayOptions.map(day => ({
      dayOfWeek: day,
      available: true,
      startTime: '00:00',
      endTime: '23:59',
    })))
  }

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault()
    if (!availabilityEmployeeId) return

    setIsSaving(true)
    resetMessages()

    try {
      const savedRows = await Promise.all(availabilityRows.map(row => availabilityApi.upsertEmployee(
        availabilityEmployeeId,
        {
          dayOfWeek: row.dayOfWeek,
          available: row.available,
          startTime: row.available ? row.startTime : null,
          endTime: row.available ? row.endTime : null,
        }
      )))
      setAvailabilityRows(buildAvailabilityRows(savedRows))
      const employee = employees.find(item => item.id.toString() === availabilityEmployeeId)
      setSuccess(`${employee?.name || 'Employee'} availability was updated.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save availability.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTemplateSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const savedTemplates = await Promise.all(templateForm.days.map(day => shiftTemplatesApi.upsert({
        jobCodeId: Number(templateForm.jobCodeId),
        dayOfWeek: day,
        name: templateForm.name.trim(),
        startTime: templateForm.startTime,
        endTime: templateForm.endTime,
        minEmployees: 0,
        maxEmployees: 1,
        active: templateForm.active,
      })))
      const savedIds = new Set(savedTemplates.map(template => template.id))
      setShiftTemplates(current => [
        ...current.filter(template => !savedIds.has(template.id)),
        ...savedTemplates,
      ])
      setTemplateForm(emptyTemplateForm)
      setActiveTab('coverage')
      setSuccess(`${templateForm.name.trim()} was added to ${savedTemplates.length} day${savedTemplates.length === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save shift template.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCoverageChange = (templateId, field, value) => {
    setCoverageDrafts(current => ({
      ...current,
      [templateId]: {
        minEmployees: current[templateId]?.minEmployees ?? String(shiftTemplates.find(template => template.id === templateId)?.minEmployees ?? 0),
        maxEmployees: current[templateId]?.maxEmployees ?? String(shiftTemplates.find(template => template.id === templateId)?.maxEmployees ?? 1),
        [field]: value,
      },
    }))
  }

  const handleSaveCoverage = async (template) => {
    setIsSaving(true)
    resetMessages()

    try {
      const minEmployees = Number(template.minEmployees)
      const maxEmployees = Number(template.maxEmployees)
      const saved = await shiftTemplatesApi.upsert({
        id: template.id,
        jobCodeId: template.jobCodeId,
        dayOfWeek: template.dayOfWeek,
        name: template.name,
        startTime: template.startTime,
        endTime: template.endTime,
        minEmployees,
        maxEmployees,
        active: template.active,
      })
      setShiftTemplates(current => [...current.filter(item => item.id !== saved.id), saved])
      setCoverageDrafts(current => {
        const next = { ...current }
        delete next[template.id]
        return next
      })
      setSuccess(`${saved.name} coverage was updated for ${formatDay(saved.dayOfWeek)}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to save coverage.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveTemplate = async (template) => {
    setIsSaving(true)
    resetMessages()

    try {
      await shiftTemplatesApi.remove(template.id)
      setShiftTemplates(current => current.filter(item => item.id !== template.id))
      setPreferredShiftAssignments(current => current.filter(item => item.shiftTemplateId !== template.id))
      setPreferredShiftForm(current => (
        current.shiftTemplateId === template.id.toString()
          ? { ...current, shiftTemplateId: '' }
          : current
      ))
      setSuccess(`${template.name} was deleted.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to delete shift template.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (role !== 'manager') {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Team</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Team setup is available to managers.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Restaurant setup</p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Team</h1>
        </div>
        <div className="grid grid-cols-3 gap-6 text-right">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{employees.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Job codes</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{jobCodes.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{shiftTemplates.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading setup...</p>}

      {!isLoading && activeTab === 'employees' && (
        <SectionShell
          title="Employees"
          actionTitle="Add Employee"
          action={
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <TextInput
                label="Name"
                name="name"
                value={employeeForm.name}
                onChange={event => setEmployeeForm(current => ({ ...current, name: event.target.value }))}
                required
                maxLength={100}
              />
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={employeeForm.email}
                onChange={event => setEmployeeForm(current => ({ ...current, email: event.target.value }))}
                required
              />
              <TextInput
                label="Temporary password"
                name="password"
                type="password"
                value={employeeForm.password}
                onChange={event => setEmployeeForm(current => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
                maxLength={100}
              />
              <PrimaryButton type="submit" disabled={isSaving}>
                {isSaving ? 'Adding...' : 'Add Employee'}
              </PrimaryButton>
            </form>
          }
        >
          {sortedEmployees.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No employees have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Protection</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{employee.name}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{employee.email}</td>
                      <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          employee.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                        }`}>
                          {employee.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleToggleProtectedEmployee(employee)}
                          disabled={isSaving}
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            employee.protectedEmployee
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                          }`}
                        >
                          {employee.protectedEmployee ? 'Protected' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setEmployeeToDelete(employee)}
                          disabled={isSaving}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionShell>
      )}

      {!isLoading && activeTab === 'availability' && (
        <SectionShell
          title="Employee Availability"
          actionTitle="Edit Availability"
          action={
            <div className="space-y-4">
              <SelectInput
                label="Employee"
                value={availabilityEmployeeId}
                onChange={event => setAvailabilityEmployeeId(event.target.value)}
                disabled={!sortedEmployees.length || isAvailabilityLoading || isSaving}
              >
                <option value="">Select employee</option>
                {sortedEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </SelectInput>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Employees must be available for the full shift time to be assigned automatically.
              </p>
              <button
                type="button"
                onClick={setOpenAvailability}
                disabled={!availabilityEmployeeId || isAvailabilityLoading || isSaving}
                className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 font-semibold text-sm transition-colors"
              >
                Open Availability
              </button>
            </div>
          }
        >
          {!availabilityEmployeeId ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Add an employee before setting availability.</p>
          ) : isAvailabilityLoading ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Loading availability...</p>
          ) : (
            <form onSubmit={handleAvailabilitySubmit}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Day</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Available</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Start</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilityRows.map(row => (
                      <tr key={row.dayOfWeek}>
                        <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{formatDay(row.dayOfWeek)}</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <input
                            type="checkbox"
                            checked={row.available}
                            onChange={event => updateAvailabilityRow(row.dayOfWeek, { available: event.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <input
                            type="time"
                            value={row.startTime}
                            disabled={!row.available}
                            onChange={event => updateAvailabilityRow(row.dayOfWeek, { startTime: event.target.value })}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <input
                            type="time"
                            value={row.endTime}
                            disabled={!row.available}
                            onChange={event => updateAvailabilityRow(row.dayOfWeek, { endTime: event.target.value })}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </form>
          )}
        </SectionShell>
      )}

      {!isLoading && activeTab === 'jobCodes' && (
        <SectionShell
          title="Job Codes"
          actionTitle="Add Job Code"
          action={
            <form onSubmit={handleJobCodeSubmit} className="space-y-4">
              <TextInput
                label="Name"
                value={jobCodeForm.name}
                onChange={event => setJobCodeForm(current => ({ ...current, name: event.target.value }))}
                required
                maxLength={100}
              />
              <TextInput
                label="Rank"
                type="number"
                min="1"
                value={jobCodeForm.rank}
                onChange={event => setJobCodeForm(current => ({ ...current, rank: event.target.value }))}
                required
              />
              <PrimaryButton type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Job Code'}
              </PrimaryButton>
            </form>
          }
        >
          {sortedJobCodes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No job codes have been defined yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Rank</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJobCodes.map(jobCode => (
                    <tr key={jobCode.id}>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{jobCode.rank}</td>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{jobCode.name}</td>
                      <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setJobCodeToDelete(jobCode)}
                          disabled={isSaving}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionShell>
      )}

      {!isLoading && activeTab === 'assignments' && (
        <SectionShell
          title="Employee Job Codes"
          actionTitle="Assign Job Code"
          action={
            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <SelectInput
                label="Employee"
                value={assignmentForm.employeeId}
                onChange={event => setAssignmentForm(current => ({ ...current, employeeId: event.target.value }))}
                required
              >
                <option value="">Select employee</option>
                {sortedEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </SelectInput>
              <SelectInput
                label="Job code"
                value={assignmentForm.jobCodeId}
                onChange={event => setAssignmentForm(current => ({ ...current, jobCodeId: event.target.value }))}
                required
              >
                <option value="">Select job code</option>
                {sortedJobCodes.map(jobCode => (
                  <option key={jobCode.id} value={jobCode.id}>{jobCode.name}</option>
                ))}
              </SelectInput>
              <PrimaryButton type="submit" disabled={isSaving || !employees.length || !jobCodes.length}>
                {isSaving ? 'Assigning...' : 'Assign Job Code'}
              </PrimaryButton>
            </form>
          }
        >
          {assignments.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No employees have job codes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Job code</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...assignments]
                    .sort((a, b) => a.employeeName.localeCompare(b.employeeName) || a.jobCodeRank - b.jobCodeRank)
                    .map(assignment => (
                      <tr key={assignment.id}>
                        <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{assignment.employeeName}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{assignment.jobCodeName}</td>
                        <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleRemoveAssignment(assignment)}
                            disabled={isSaving}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionShell>
      )}

      {!isLoading && activeTab === 'priorities' && (
        <div className="space-y-6">
          <SectionShell
            title="Employee Role Priorities"
            actionTitle={priorityForm.id ? 'Edit Priority' : 'Set Priority'}
            action={
              <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority key</p>
                <div className="space-y-2">
                  {priorityGuide.map(item => (
                    <div key={item.value} className="grid grid-cols-[4rem_1fr] gap-2 text-xs">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{item.value}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span> - {item.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <SelectInput
                label="Employee"
                value={priorityForm.employeeId}
                onChange={event => setPriorityForm(current => ({ ...current, employeeId: event.target.value }))}
                required
              >
                <option value="">Select employee</option>
                {sortedEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </SelectInput>
              <SelectInput
                label="Job code"
                value={priorityForm.jobCodeId}
                onChange={event => setPriorityForm(current => ({ ...current, jobCodeId: event.target.value }))}
                required
              >
                <option value="">Select job code</option>
                {sortedJobCodes.map(jobCode => (
                  <option key={jobCode.id} value={jobCode.id}>{jobCode.name}</option>
                ))}
              </SelectInput>
              <TextInput
                label="Priority"
                type="number"
                min="0"
                value={priorityForm.priority}
                onChange={event => setPriorityForm(current => ({ ...current, priority: event.target.value }))}
                required
              />
              <div className="flex gap-2">
                {priorityForm.id && (
                  <SecondaryButton type="button" onClick={handleCancelPriorityEdit} disabled={isSaving}>
                    Cancel
                  </SecondaryButton>
                )}
                <PrimaryButton type="submit" disabled={isSaving || !employees.length || !jobCodes.length}>
                  {isSaving ? 'Saving...' : priorityForm.id ? 'Update Priority' : 'Save Priority'}
                </PrimaryButton>
              </div>
              </form>
            }
          >
          {sortedRolePriorities.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No role priorities have been set yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Job code</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Priority</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRolePriorities.map(priority => (
                    <tr key={priority.id}>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{priority.employeeName}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{priority.jobCodeName}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{priority.priority}</td>
                      <td className="p-3 text-sm text-right border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-end gap-2">
                          <SecondaryButton type="button" onClick={() => handleEditPriority(priority)} disabled={isSaving}>
                            Edit
                          </SecondaryButton>
                          <DangerButton type="button" onClick={() => setPriorityToDelete(priority)} disabled={isSaving}>
                            Delete
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </SectionShell>

          <SectionShell
            title="Preferred Shift Assignments"
            actionTitle="Assign Preferred Shift"
            action={
              <form onSubmit={handlePreferredShiftSubmit} className="space-y-4">
                <SelectInput
                  label="Employee"
                  value={preferredShiftForm.employeeId}
                  onChange={event => setPreferredShiftForm(current => ({ ...current, employeeId: event.target.value }))}
                  required
                >
                  <option value="">Select employee</option>
                  {sortedEmployees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </SelectInput>
                <SelectInput
                  label="Shift"
                  value={preferredShiftForm.shiftTemplateId}
                  onChange={event => setPreferredShiftForm(current => ({ ...current, shiftTemplateId: event.target.value }))}
                  required
                >
                  <option value="">Select shift</option>
                  {sortedTemplates.map(template => (
                    <option key={template.id} value={template.id}>{formatTemplateLabel(template)}</option>
                  ))}
                </SelectInput>
                <PrimaryButton type="submit" disabled={isSaving || !employees.length || !shiftTemplates.length}>
                  {isSaving ? 'Saving...' : 'Save Preferred Shift'}
                </PrimaryButton>
              </form>
            }
          >
            {sortedPreferredShiftAssignments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No preferred shift assignments have been set yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Shift</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Job code</th>
                      <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPreferredShiftAssignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{assignment.employeeName}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          {formatDay(assignment.dayOfWeek)} - {assignment.shiftTemplateName} ({formatTime(assignment.startTime)}-{formatTime(assignment.endTime)})
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{assignment.jobCodeName}</td>
                        <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleDeletePreferredShiftAssignment(assignment)}
                            disabled={isSaving}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionShell>
        </div>
      )}

      {!isLoading && activeTab === 'templates' && (
        <SectionShell
          title="Possible Shifts"
          actionTitle="Add Shift Template"
          action={
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <SelectInput
                label="Job code"
                value={templateForm.jobCodeId}
                onChange={event => setTemplateForm(current => ({ ...current, jobCodeId: event.target.value }))}
                required
              >
                <option value="">Select job code</option>
                {sortedJobCodes.map(jobCode => (
                  <option key={jobCode.id} value={jobCode.id}>{jobCode.name}</option>
                ))}
              </SelectInput>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {dayOptions.map(day => (
                    <label key={day} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={templateForm.days.includes(day)}
                        onChange={event => setTemplateForm(current => ({
                          ...current,
                          days: event.target.checked
                            ? [...current.days, day]
                            : current.days.filter(item => item !== day),
                        }))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {formatDay(day)}
                    </label>
                  ))}
                </div>
              </div>
              <TextInput
                label="Template name"
                value={templateForm.name}
                onChange={event => setTemplateForm(current => ({ ...current, name: event.target.value }))}
                required
                maxLength={100}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Start"
                  type="time"
                  value={templateForm.startTime}
                  onChange={event => setTemplateForm(current => ({ ...current, startTime: event.target.value }))}
                  required
                />
                <TextInput
                  label="End"
                  type="time"
                  value={templateForm.endTime}
                  onChange={event => setTemplateForm(current => ({ ...current, endTime: event.target.value }))}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={templateForm.active}
                  onChange={event => setTemplateForm(current => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Active
              </label>
              <PrimaryButton type="submit" disabled={isSaving || !jobCodes.length || templateForm.days.length === 0}>
                {isSaving ? 'Saving...' : 'Save Shift Template'}
              </PrimaryButton>
            </form>
          }
        >
          {sortedTemplates.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">No possible shifts have been defined yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Day</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Shift</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Job code</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Time</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Staff</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTemplates.map(template => (
                    <tr key={template.id}>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{formatDay(template.dayOfWeek)}</td>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{template.name}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{template.jobCodeName}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{formatTime(template.startTime)} - {formatTime(template.endTime)}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{template.minEmployees}-{template.maxEmployees}</td>
                      <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleRemoveTemplate(template)}
                          disabled={isSaving}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionShell>
      )}

      {!isLoading && activeTab === 'coverage' && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Daily Shift Coverage</h2>
          </div>
          {coverageRows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Create shift templates before setting coverage.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Day</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Shift</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Job code</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Time</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Min</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Max</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageRows.map(template => {
                    const isDirty = Boolean(coverageDrafts[template.id])
                    return (
                      <tr key={template.id}>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{formatDay(template.dayOfWeek)}</td>
                        <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{template.name}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{template.jobCodeName}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{formatTime(template.startTime)} - {formatTime(template.endTime)}</td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <input
                            type="number"
                            min="0"
                            value={template.minEmployees}
                            onChange={event => handleCoverageChange(template.id, 'minEmployees', event.target.value)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <input
                            type="number"
                            min="1"
                            value={template.maxEmployees}
                            onChange={event => handleCoverageChange(template.id, 'maxEmployees', event.target.value)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleSaveCoverage(template)}
                            disabled={isSaving || !isDirty}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-40 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 transition-colors"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Remove employee?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will remove {employeeToDelete.name} from the team. Existing schedule shifts assigned to them may become unassigned.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEmployeeToDelete(null)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <DangerButton onClick={handleDeleteEmployee} disabled={isSaving}>
                {isSaving ? 'Removing...' : 'Remove Employee'}
              </DangerButton>
            </div>
          </div>
        </div>
      )}

      {jobCodeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Remove job code?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will remove {jobCodeToDelete.name} from the hierarchy and delete its employee assignments, priorities, staffing rules, shift templates, and related shifts.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setJobCodeToDelete(null)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <DangerButton onClick={handleDeleteJobCode} disabled={isSaving}>
                {isSaving ? 'Removing...' : 'Remove Job Code'}
              </DangerButton>
            </div>
          </div>
        </div>
      )}

      {priorityToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Remove role priority?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will remove the {priorityToDelete.jobCodeName} priority for {priorityToDelete.employeeName}. They will use the default priority for that role.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPriorityToDelete(null)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <DangerButton onClick={handleDeletePriority} disabled={isSaving}>
                {isSaving ? 'Removing...' : 'Remove Priority'}
              </DangerButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamPage
