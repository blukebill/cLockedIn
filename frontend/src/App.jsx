import { useState } from 'react'
import './App.css'
import ScheduleGrid from './ScheduleGrid'

const employees = ['Alice', 'Bob', 'Carlos']

function App() {
  return (
    <div>
      <h1>cLockedIn</h1>
      <ScheduleGrid />
      <PublishButton />
    </div>
  )
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
