const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const TOKEN_KEY = 'clockedin_token'

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) clearStoredToken()
    const message = data?.error || data?.message || response.statusText || 'Request failed'
    throw new ApiError(message, response.status, data)
  }

  return data
}

export const authApi = {
  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    storeToken(data.token)
    return data
  },

  me() {
    return apiRequest('/auth/me')
  },

  logout() {
    clearStoredToken()
  },
}

export const schedulesApi = {
  getWeek(startDate) {
    return apiRequest(`/schedules/week?startDate=${startDate}`)
  },

  getMyWeek(startDate) {
    return apiRequest(`/schedules/my/week?startDate=${startDate}`)
  },

  getPublishedWeek(startDate) {
    return apiRequest(`/schedules/published/week?startDate=${startDate}`)
  },

  generate(startDate) {
    return apiRequest('/schedules/generate', {
      method: 'POST',
      body: { startDate },
    })
  },

  publish(scheduleId) {
    return apiRequest(`/schedules/${scheduleId}/publish`, {
      method: 'POST',
    })
  },

  reopen(scheduleId) {
    return apiRequest(`/schedules/${scheduleId}/reopen`, {
      method: 'POST',
    })
  },
}

export const timeOffRequestsApi = {
  listMine() {
    return apiRequest('/time-off-requests/my')
  },

  listRestaurant() {
    return apiRequest('/time-off-requests')
  },

  create(request) {
    return apiRequest('/time-off-requests', {
      method: 'POST',
      body: request,
    })
  },

  updateStatus(id, status) {
    return apiRequest(`/time-off-requests/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },
}

export const employeesApi = {
  list() {
    return apiRequest('/employees')
  },

  create(employee) {
    return apiRequest('/employees', {
      method: 'POST',
      body: employee,
    })
  },

  update(id, employee) {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: employee,
    })
  },

  remove(id) {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    })
  },
}

export const jobCodesApi = {
  list() {
    return apiRequest('/job-codes')
  },

  upsert(jobCode) {
    return apiRequest('/job-codes', {
      method: 'PUT',
      body: jobCode,
    })
  },

  remove(id) {
    return apiRequest(`/job-codes/${id}`, {
      method: 'DELETE',
    })
  },
}

export const employeeJobCodesApi = {
  list() {
    return apiRequest('/employee-job-codes')
  },

  assign(employeeId, jobCodeId) {
    return apiRequest(`/employee-job-codes/employee/${employeeId}`, {
      method: 'PUT',
      body: { jobCodeId },
    })
  },

  remove(employeeId, jobCodeId) {
    return apiRequest(`/employee-job-codes/employee/${employeeId}/job-code/${jobCodeId}`, {
      method: 'DELETE',
    })
  },
}

export const employeeRolePrioritiesApi = {
  list() {
    return apiRequest('/employee-role-priorities')
  },

  listEmployee(employeeId) {
    return apiRequest(`/employee-role-priorities/employee/${employeeId}`)
  },

  upsert(priority) {
    return apiRequest('/employee-role-priorities', {
      method: 'PUT',
      body: priority,
    })
  },

  remove(priorityId) {
    return apiRequest(`/employee-role-priorities/${priorityId}`, {
      method: 'DELETE',
    })
  },
}

export const preferredShiftAssignmentsApi = {
  list() {
    return apiRequest('/preferred-shift-assignments')
  },

  upsert(assignment) {
    return apiRequest('/preferred-shift-assignments', {
      method: 'PUT',
      body: assignment,
    })
  },

  remove(assignmentId) {
    return apiRequest(`/preferred-shift-assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  },
}

export const shiftTemplatesApi = {
  list() {
    return apiRequest('/shift-templates')
  },

  upsert(template) {
    return apiRequest('/shift-templates', {
      method: 'PUT',
      body: template,
    })
  },

  remove(id) {
    return apiRequest(`/shift-templates/${id}`, {
      method: 'DELETE',
    })
  },
}

export const restaurantSettingsApi = {
  get() {
    return apiRequest('/restaurant/settings')
  },

  update(settings) {
    return apiRequest('/restaurant/settings', {
      method: 'PUT',
      body: settings,
    })
  },
}

export const forecastsApi = {
  getWeek(startDate) {
    return apiRequest(`/forecasts/week?startDate=${startDate}`)
  },

  upsert(date, forecast) {
    return apiRequest(`/forecasts/${date}`, {
      method: 'PUT',
      body: forecast,
    })
  },
}

export const staffingRulesApi = {
  list() {
    return apiRequest('/staffing-rules')
  },

  upsert(rule) {
    return apiRequest('/staffing-rules', {
      method: 'PUT',
      body: rule,
    })
  },

  remove(ruleId) {
    return apiRequest(`/staffing-rules/${ruleId}`, {
      method: 'DELETE',
    })
  },
}

export const availabilityApi = {
  listEmployee(employeeId) {
    return apiRequest(`/availability/employee/${employeeId}`)
  },

  upsertEmployee(employeeId, availability) {
    return apiRequest(`/availability/employee/${employeeId}`, {
      method: 'PUT',
      body: availability,
    })
  },
}
