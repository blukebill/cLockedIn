import { useState } from 'react'
import Login from './pages/Login'
import ScheduleGrid from './components/ScheduleGrid'
import Navbar from './components/Navbar'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import './App.css'


function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [isPublished, setIsPublished] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [publishedWeek, setPublishedWeek] = useState ('')
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  const handleLogout = () => {
    setRole(null)
    setPage('dashboard')
    setIsBannerDismissed(false)
  }

  if (role === null) {
    return <Login onLogin={setRole} />
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
        {page === 'dashboard' && role === 'employee' && <EmployeeDashboard setPage={setPage} />}
        {page === 'dashboard' && role === 'manager' && <ManagerDashboard setPage={setPage} />}
        {page === 'schedule' && <ScheduleGrid role={role} isGenerated={isGenerated} setIsGenerated={setIsGenerated} isPublished={isPublished} setIsPublished={setIsPublished} publishedWeek={publishedWeek} setPublishedWeek={setPublishedWeek} />}
        {page === 'team' && <h1>Team</h1>}
        {page === 'earnings' && <h1>Earnings</h1>}
        {page === 'messages' && <h1>Messages</h1>} 
      </div>
    </div>
  )
}

export default App
