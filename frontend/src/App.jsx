import { useState } from 'react'
import Login from './pages/Login'
import './App.css'
import ScheduleGrid from './components/ScheduleGrid'

const employees = ['Alice', 'Bob', 'Carlos']

function App() {
  const [role, setRole] = useState(null)

  if (role === null) {
    return <Login onLogin={setRole} />
  }

  if (role === 'manager') {
    return (
      <>
        <h1>Manager Dashboard</h1>
        <ScheduleGrid />
        <PublishButton />
      </>
    )
  }

  if (role === 'employee') {
    return (
      <>
        <h1>Employee Dashboard</h1>
        <ScheduleGrid />
      </>
    )
  }
}

function PublishButton() {
  const [published, setPublished] = useState(false)

  return (
    <button onClick={() => setPublished(true)}>
      {published ? 'Schedule Published' : 'Publish Schedule?'}
    </button>
  )
}

function EmployeeList() {
  return (
    <ul>
      {employees.map(name => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  )
}

export default App
