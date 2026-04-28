import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import Login from '../src/pages/Login'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
}))

vi.mock('../src/services/api', () => ({
  authApi: {
    login: mocks.login,
  },
}))

const renderLogin = (onLogin = vi.fn()) =>
  render(<Login onLogin={onLogin} />)

describe('Login Page', () => {
  beforeEach(() => {
    mocks.login.mockReset()
  })

  // --- Rendering ---

  it('renders a username input', () => {
    renderLogin()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders a password input', () => {
    renderLogin()
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
  })

  it('renders a submit button', () => {
    renderLogin()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // --- Input Handling ---

  it('allows typing in the username field', () => {
    renderLogin()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'admin' } })
    expect(input.value).toBe('admin')
  })

  it('password field accepts input', () => {
    renderLogin()
    const passwordInput = document.querySelector('input[type="password"]')
    fireEvent.change(passwordInput, { target: { value: 'admin' } })
    expect(passwordInput.value).toBe('admin')
  })

  // --- Auth Logic ---

  it('calls onLogin with the backend user for valid manager credentials', async () => {
    const onLogin = vi.fn()
    const user = { userId: 1, name: 'Manager One', email: 'manager1@demo.com', role: 'MANAGER' }
    mocks.login.mockResolvedValue(user)
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'manager1@demo.com' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user))
  })

  it('calls onLogin with the backend user for valid employee credentials', async () => {
    const onLogin = vi.fn()
    const user = { userId: 2, name: 'Employee One', email: 'employee1@demo.com', role: 'EMPLOYEE' }
    mocks.login.mockResolvedValue(user)
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'employee1@demo.com' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'user' } })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user))
  })

  it('shows an error message for invalid credentials', async () => {
    mocks.login.mockRejectedValue(new Error('Invalid email or password.'))
    renderLogin()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })

  it('does not call onLogin for invalid credentials', async () => {
    const onLogin = vi.fn()
    mocks.login.mockRejectedValue(new Error('Invalid email or password.'))
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onLogin).not.toHaveBeenCalled())
  })
})
