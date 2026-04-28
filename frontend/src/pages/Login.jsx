import { useState, useEffect } from 'react'
import { authApi } from '../services/api'

function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const user = await authApi.login(email, password)
            setError('')
            onLogin(user)
        } catch (err) {
            setError(err.message || 'Invalid email or password.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    const [isDark, setIsDark] = useState (
        window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => setIsDark(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    return (
        < div className='min-h-screen flex items-cetner justify-center bg-gray-100 dark:bg-gray-900'>
            <div className='bg-white dark:bg-gray-800 rounded-2x1 border border-gray-200 dark:border-gray-700 p-12 w-full max-w-md'>
                {/* Logo */}
                <div className='flex justify-center mb-8'>
                    <img
                      src={isDark ? '/clockedin-logo-dark.svg' : '/clockedin-logo.svg'}
                      alt="cLockedIn"
                      className="h-24 w-auto"
                    />
                </div>

                {/* Title */}
                <h2 className='text-2x1 font-semibold text-center text-gray-900 dark:text-gray-100 mb-1'>
                    Welcome Back
                </h2>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-7">
                    Sign in to your account
                </p>

                {/* Error message */}
                {error && (
                    <div className='bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400'>
                        {error}
                    </div>
                )}

                {/* Username */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                        Email
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                        Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 active:sacle-95 text-white font-semibold text-sm transition-all"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
            </div>
        </div>
    )
}

export default Login
