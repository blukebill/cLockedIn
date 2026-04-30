import { useEffect, useMemo, useState } from 'react'
import { timeOffRequestsApi } from '../services/api'

const emptyRequestForm = {
  startDate: '',
  endDate: '',
  startTime: '00:00',
  endTime: '23:59',
  reason: '',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function fieldError(err, fallback) {
  const fields = err.details?.fields
  return fields ? Object.values(fields)[0] : err.message || fallback
}

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return ''
  const [hoursPart, minutesPart] = value.slice(0, 5).split(':')
  let hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`
}

function statusClass(status) {
  if (status === 'APPROVED') {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  }
  if (status === 'DENIED') {
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
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

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <textarea
        {...props}
        className="w-full min-h-28 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70 text-white font-semibold text-sm transition-colors"
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

function RequestTable({ requests, role, isSaving, onStatusChange }) {
  if (requests.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
        No time off requests yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {role === 'manager' && (
              <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Employee</th>
            )}
            <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Dates</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Time</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Reason</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
            {role === 'manager' && (
              <th className="p-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id}>
              {role === 'manager' && (
                <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                  <p>{request.userName || request.userEmail}</p>
                  {request.userName && <p className="text-xs text-gray-500 dark:text-gray-400">{request.userEmail}</p>}
                </td>
              )}
              <td className="p-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                {formatDate(request.startDate)}{request.startDate !== request.endDate ? ` - ${formatDate(request.endDate)}` : ''}
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                {formatTime(request.startTime)} - {formatTime(request.endTime)}
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 max-w-xs">
                {request.reason || 'No reason provided'}
              </td>
              <td className="p-3 border-b border-gray-100 dark:border-gray-700">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusClass(request.status)}`}>
                  {request.status}
                </span>
              </td>
              {role === 'manager' && (
                <td className="p-3 text-right border-b border-gray-100 dark:border-gray-700">
                  {request.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                      <PrimaryButton type="button" onClick={() => onStatusChange(request, 'APPROVED')} disabled={isSaving}>
                        Approve
                      </PrimaryButton>
                      <DangerButton type="button" onClick={() => onStatusChange(request, 'DENIED')} disabled={isSaving}>
                        Deny
                      </DangerButton>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Reviewed</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TimeOffPage({ role }) {
  const [requests, setRequests] = useState([])
  const [requestForm, setRequestForm] = useState(emptyRequestForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const sortedRequests = useMemo(() => {
    const statusOrder = { PENDING: 0, APPROVED: 1, DENIED: 2 }
    return [...requests].sort((a, b) => (
      (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
      || b.createdAt.localeCompare(a.createdAt)
    ))
  }, [requests])

  useEffect(() => {
    const loader = role === 'manager'
      ? timeOffRequestsApi.listRestaurant()
      : timeOffRequestsApi.listMine()

    loader
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Unable to load time off requests.'))
      .finally(() => setIsLoading(false))
  }, [role])

  const resetMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    resetMessages()

    try {
      const saved = await timeOffRequestsApi.create({
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        startTime: requestForm.startTime,
        endTime: requestForm.endTime,
        reason: requestForm.reason.trim(),
      })
      setRequests(current => [saved, ...current])
      setRequestForm(emptyRequestForm)
      setSuccess('Time off request submitted.')
    } catch (err) {
      setError(fieldError(err, 'Unable to submit time off request.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (request, status) => {
    setIsSaving(true)
    resetMessages()

    try {
      const updated = await timeOffRequestsApi.updateStatus(request.id, status)
      setRequests(current => current.map(item => item.id === updated.id ? updated : item))
      setSuccess(`${updated.userName || updated.userEmail} request was ${status.toLowerCase()}.`)
    } catch (err) {
      setError(fieldError(err, 'Unable to update request.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {role === 'manager' ? 'Team requests' : 'Availability request'}
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Time Off</h1>
        </div>
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

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading requests...</p>
      ) : role === 'manager' ? (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Requests</h2>
          </div>
          <RequestTable requests={sortedRequests} role={role} isSaving={isSaving} onStatusChange={handleStatusChange} />
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-6 items-start">
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">My Requests</h2>
            </div>
            <RequestTable requests={sortedRequests} role={role} isSaving={isSaving} onStatusChange={handleStatusChange} />
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Request Time Off</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                label="Start date"
                type="date"
                min={todayIso()}
                value={requestForm.startDate}
                onChange={event => setRequestForm(current => ({ ...current, startDate: event.target.value }))}
                required
              />
              <TextInput
                label="End date"
                type="date"
                min={requestForm.startDate || todayIso()}
                value={requestForm.endDate}
                onChange={event => setRequestForm(current => ({ ...current, endDate: event.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Start time"
                  type="time"
                  value={requestForm.startTime}
                  onChange={event => setRequestForm(current => ({ ...current, startTime: event.target.value }))}
                  required
                />
                <TextInput
                  label="End time"
                  type="time"
                  value={requestForm.endTime}
                  onChange={event => setRequestForm(current => ({ ...current, endTime: event.target.value }))}
                  required
                />
              </div>
              <TextArea
                label="Reason"
                maxLength={500}
                value={requestForm.reason}
                onChange={event => setRequestForm(current => ({ ...current, reason: event.target.value }))}
                placeholder="Optional"
              />
              <div className="flex justify-end">
                <SecondaryButton type="button" onClick={() => setRequestForm(emptyRequestForm)} disabled={isSaving}>
                  Clear
                </SecondaryButton>
                <div className="ml-2">
                  <PrimaryButton type="submit" disabled={isSaving}>
                    {isSaving ? 'Submitting...' : 'Submit Request'}
                  </PrimaryButton>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default TimeOffPage
