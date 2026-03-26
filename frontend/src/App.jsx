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

  const handleLogout = () => {
    setRole(null)
    setPage('dashboard')
  }

  if (role === null) {
    return <Login onLogin={setRole} />
  }

  return (
    <div>
      <Navbar page={page} setPage={setPage} role={role} onLogout={handleLogout} />
      
      {/* Notification Banner - only shows for employees after publish */}
      {isPublished && role === 'employee' && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: '#fff',
          padding: '12px 24px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          A new schedule for {new Date().toLocaleDateString('en-US', { month: 'long' })} has been posted. Check your schedule!
        </div>
      )}

      <div style={{ padding: '24px' }}>
        {page === 'dashboard' && role === 'employee' && <EmployeeDashboard setPage={setPage} />}
        {page === 'dashboard' && role === 'manager' && <ManagerDashboard setPage={setPage} />}
        {page === 'schedule' && <ScheduleGrid role={role} isGenerated={isGenerated} setIsGenerated={setIsGenerated} isPublished={isPublished} setIsPublished={setIsPublished} />}
        {page === 'team' && <h1>Team</h1>}
        {page === 'earnings' && <h1>Earnings</h1>}
        {page === 'messages' && <h1>Messages</h1>} 
      </div>
    </div>
  )
}

export default App
