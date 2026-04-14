import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Login from '../src/pages/Login'

const renderLogin = (onLogin = vi.fn()) =>
  render(<Login onLogin={onLogin} />)

describe('Login Page', () => {

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

  it('calls onLogin with "manager" for valid manager credentials', () => {
    const onLogin = vi.fn()
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'admin' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button'))
    expect(onLogin).toHaveBeenCalledWith('manager')
  })

  it('calls onLogin with "employee" for valid employee credentials', () => {
    const onLogin = vi.fn()
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'user' } })
    fireEvent.click(screen.getByRole('button'))
    expect(onLogin).toHaveBeenCalledWith('employee')
  })

  it('shows an error message for invalid credentials', () => {
    renderLogin()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
  })

  it('does not call onLogin for invalid credentials', () => {
    const onLogin = vi.fn()
    renderLogin(onLogin)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button'))
    expect(onLogin).not.toHaveBeenCalled()
  })
})
