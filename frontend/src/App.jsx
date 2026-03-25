import { useState } from 'react'
import Login from './pages/Login'
import ScheduleGrid from './components/ScheduleGrid'
import Navbar from './components/Navbar'
import EmployeeDashboard from './pages/EmployeeDashboard'
import './App.css'


function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('dashboard')
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
      <div style={{ padding: '24px' }}>
        {page === 'dashboard' && role === 'employee' && <EmployeeDashboard setPage={setPage} />}
        {page === 'dashboard' && role === 'manager' && <h1>Manager Dashboard</h1>}
        {page === 'schedule' && <ScheduleGrid role={role} />}
        {page === 'team' && <h1>Team</h1>}
        {page === 'earnings' && <h1>Earnings</h1>}
        {page === 'messages' && <h1>Messages</h1>} 
      </div>
    </div>
  )
}

export default App
