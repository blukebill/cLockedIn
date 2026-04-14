import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmployeeDashboard from '../src/pages/EmployeeDashboard'

const renderEmployeeDashboard = (setPage = vi.fn()) =>
  render(<EmployeeDashboard setPage={setPage} />)

describe('Employee Dashboard', () => {

  // --- Rendering ---

  it('renders without crashing', () => {
    renderEmployeeDashboard()
    expect(document.body).toBeTruthy()
  })

  it('displays the employee welcome message', () => {
    renderEmployeeDashboard()
    expect(screen.getByText(/welcome back, employee/i)).toBeInTheDocument()
  })

  it('renders a schedule section', () => {
    renderEmployeeDashboard()
    expect(screen.getAllByText(/schedule/i)[0]).toBeInTheDocument()
  })

  it('renders shift or hours information', () => {
    renderEmployeeDashboard()
    expect(
      screen.getAllByText(/hours|shift|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)[0]
    ).toBeInTheDocument()
  })

  it('does not render manager-only UI', () => {
    renderEmployeeDashboard()
    expect(screen.queryByText(/tony n\./i)).not.toBeInTheDocument()
  })
})
