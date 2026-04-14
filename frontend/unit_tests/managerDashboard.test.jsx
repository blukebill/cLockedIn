import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ManagerDashboard from '../src/pages/ManagerDashboard'

const renderManagerDashboard = (setPage = vi.fn()) =>
  render(<ManagerDashboard setPage={setPage} />)

describe('Manager Dashboard', () => {

  // --- Rendering ---

  it('renders without crashing', () => {
    renderManagerDashboard()
    expect(document.body).toBeTruthy()
  })

  it('displays the demo manager name', () => {
    renderManagerDashboard()
    expect(screen.getAllByText(/tony n\./i)[0]).toBeInTheDocument()
  })

  it('renders a schedule section', () => {
    renderManagerDashboard()
    expect(screen.getAllByText(/schedule/i)[0]).toBeInTheDocument()
  })

  it('renders shift or hours information', () => {
    renderManagerDashboard()
    expect(
      screen.getAllByText(/hours|shift|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)[0]
    ).toBeInTheDocument()
  })

  it('does not render employee-only UI', () => {
    renderManagerDashboard()
    expect(screen.queryByText(/marcus j\./i)).not.toBeInTheDocument()
  })
})
