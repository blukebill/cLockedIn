import { useState } from 'react'

const CREDENTIALS = {
    admin: { password: 'admin' , role: 'manager' },
    user: { password: 'user', role: 'employee' }
}

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = () => {
        const match = CREDENTIALS[username]
        if (match && match.password === password) {
            setError('')
            onLogin(match.role)
        } else {
            setError('Invalid username or password.')
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    return (
        < div style={{
            minHeight: '100vh',
            display: 'flex',
            akignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                border: '1px solid #e0e0e0',
                padding: '48px 40px',
                width: '100%',
                maxWidth: '400px',
                boxSizing: 'border-box'
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img
                      src="/clockedin-logo.svg"
                      alt="cLockedIn"
                      style={{ heihgt: '56px', width: 'auto', maxWidth: '100%'}}
                    />
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 4px',
                    fontSize: '22px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: '#111'
                }}>
                    Welcome Back
                </h2>
                <p style={{
                    margin: '0 0 28px',
                    fontSize: '14px',
                    color: '#888',
                    textAlign: 'center'
                }}>
                    Sign in to your account
                </p>

                {/* Error message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fff0f0',
                        border: '1px solid #ffcccc',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#cc0000'
                    }}>
                        {error}
                    </div>
                )}

                {/* Username */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '13px',
                        color: '#555',
                        marginBottom: '6px',
                        fontWeight: '500'
                    }}>
                        Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your username"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '13px',
                        color: '#555',
                        marginBottom: '6px',
                        fontWeight: '500'
                    }}>
                        Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borerRadius: '8px',
                        border: '1px solid #e0e0e0',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                    Sign In
                </button>
            </div>
        </div>
    )
}

export default Login