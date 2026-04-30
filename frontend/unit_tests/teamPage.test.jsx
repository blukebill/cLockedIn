import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import TeamPage from '../src/pages/TeamPage'

const mocks = vi.hoisted(() => ({
  listAvailability: vi.fn(),
  listEmployees: vi.fn(),
  listJobCodes: vi.fn(),
  listAssignments: vi.fn(),
  listPriorities: vi.fn(),
  listPreferredShifts: vi.fn(),
  listTemplates: vi.fn(),
}))

vi.mock('../src/services/api', () => ({
  availabilityApi: {
    listEmployee: mocks.listAvailability,
  },
  employeesApi: {
    list: mocks.listEmployees,
  },
  jobCodesApi: {
    list: mocks.listJobCodes,
  },
  employeeJobCodesApi: {
    list: mocks.listAssignments,
  },
  employeeRolePrioritiesApi: {
    list: mocks.listPriorities,
  },
  preferredShiftAssignmentsApi: {
    list: mocks.listPreferredShifts,
  },
  shiftTemplatesApi: {
    list: mocks.listTemplates,
  },
}))

describe('Team Page', () => {
  beforeEach(() => {
    mocks.listAvailability.mockResolvedValue([])
    mocks.listEmployees.mockResolvedValue([
      { id: 10, name: 'Alex Server', email: 'alex@example.com', enabled: true },
    ])
    mocks.listJobCodes.mockResolvedValue([
      { id: 20, name: 'Server', rank: 3 },
    ])
    mocks.listAssignments.mockResolvedValue([])
    mocks.listPriorities.mockResolvedValue([
      { id: 30, employeeId: 10, jobCodeId: 20, priority: 250 },
    ])
    mocks.listPreferredShifts.mockResolvedValue([])
    mocks.listTemplates.mockResolvedValue([])
  })

  it('renders role priorities when the API returns only ids and priority values', async () => {
    render(<TeamPage role="manager" />)

    await waitFor(() => expect(screen.queryByText(/loading setup/i)).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /priorities/i }))

    expect(screen.getAllByText('Alex Server')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Server')[0]).toBeInTheDocument()
    expect(screen.getAllByText('250')[0]).toBeInTheDocument()
  })
})
