import { useEffect, useState } from 'react'
import Login from './pages/Login'
import ScheduleGrid from './components/ScheduleGrid'
import Navbar from './components/Navbar'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import TeamPage from './pages/TeamPage'
import TimeOffPage from './pages/TimeOffPage'
import { authApi, getStoredToken } from './services/api'
import { toAppRole } from './utils/apiScheduleAdapter'
import './App.css'


function App() {
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getStoredToken()))
  const [page, setPage] = useState('dashboard')
  const [isPublished, setIsPublished] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [publishedWeek, setPublishedWeek] = useState ('')
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [scheduleVersion, setScheduleVersion] = useState(0)

  const role = toAppRole(user?.role)

  useEffect(() => {
    if (!getStoredToken()) return

    authApi.me()
      .then(setUser)
      .catch(() => {
        authApi.logout()
        setUser(null)
      })
      .finally(() => setIsBootstrapping(false))
  }, [])

  const handleLogin = (nextUser) => {
    setUser(nextUser)
    setPage('dashboard')
  }

  const handleLogout = () => {
    authApi.logout()
    setUser(null)
    setPage('dashboard')
    setIsGenerated(false)
    setIsPublished(false)
    setPublishedWeek('')
    setIsBannerDismissed(false)
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    )
  }

  if (user === null) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar page={page} setPage={setPage} role={role} onLogout={handleLogout} />
      
      {/* Notification Banner - only shows for employees after publish */}
      {isPublished && role === 'employee' && !isBannerDismissed && (
        <div className="bg-green-600 text-white px-6 py-3 text-sm flex items-center justify-between">
          <span> A new schedule for {publishedWeek} has been posted. Check your schedule!</span>
          <button
            onClick={() => setIsBannerDismissed(true)}
            className="text-white hover:text-green-200 transition-colors ml-4 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-6">
        {page === 'dashboard' && role === 'employee' && <EmployeeDashboard setPage={setPage} user={user} scheduleVersion={scheduleVersion} />}
        {page === 'dashboard' && role === 'manager' && <ManagerDashboard setPage={setPage} user={user} scheduleVersion={scheduleVersion} />}
        {page === 'schedule' && <ScheduleGrid role={role} isGenerated={isGenerated} setIsGenerated={setIsGenerated} isPublished={isPublished} setIsPublished={setIsPublished} publishedWeek={publishedWeek} setPublishedWeek={setPublishedWeek} onScheduleChanged={() => setScheduleVersion(version => version + 1)} />}
        {page === 'team' && <TeamPage role={role} />}
        {page === 'timeOff' && <TimeOffPage role={role} />}
        {page === 'earnings' && <h1>Earnings</h1>}
        {page === 'messages' && <h1>Messages</h1>} 
      </div>
    </div>
  )
}

export default App
