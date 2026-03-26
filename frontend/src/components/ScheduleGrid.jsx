import { useState } from 'react'
import { scheduleData } from '../constants/scheduleData'
import { days } from '../constants/days'
import { roleColors } from '../constants/roleColors'

const ShiftPill = ({ shift }) => (
  <span style={{
    backgroundColor: roleColors[shift.role],
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    display: 'inline-block'
  }}>
    {shift.role}
  </span>
)

const ListView = ({ getShifts }) => (
  <div>
    {days.map(day => (
      <div key={day} style={{ marginBottom: '32px' }}>
        <h2 style={{ textAlign: 'left' }}>{day}</h2>
        {['Morning', 'Evening'].map(period => {
          const shifts = getShifts(day, period)
          if (shifts.length === 0) return null
          return (
            <div key={period}>
              <h3 style={{ textAlign: 'left' }}>{period}</h3>
              {shifts.map(shift => (
                <div key={shift.id} style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #ccc',
                  textAlign: 'left'
                }}>
                  <ShiftPill shift={shift} />
                  <span>{shift.employee}</span>
                  <span>{shift.startTime} - {shift.endTime}</span>
                  <span>${shift.estimatedEarnings}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    ))}
  </div>
)

const EmployeeRowView = ({ employees }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Employee</th>
          {days.map(day => (
            <th key={day} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ccc' }}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {employees.map(employee => (
          <tr key={employee}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ccc', whiteSpace: 'nowrap' }}>{employee}</td>
            {days.map(day => {
              const morning = scheduleData.find(s => {
                if (s.employee !== employee || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'AM'
              })
              const evening = scheduleData.find(s => {
                if (s.employee !== employee || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'PM'
              })
              return (
                <td key={day} style={{ padding: '4px', borderBottom: '1px solid #ccc', verticalAlign: 'top', minWidth: '90px' }}>
                  {morning && (
                    <div style={{
                      backgroundColor: roleColors[morning.role],
                      color: '#fff',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginBottom: evening ? '2px' : '0'
                    }}>
                      <div>{morning.role}</div>
                      <div style={{ opacity: 0.85 }}>{morning.startTime} - {morning.endTime}</div>
                    </div>
                  )}
                  {evening && (
                    <div style={{
                      backgroundColor: roleColors[evening.role],
                      color: '#fff',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      <div>{evening.role}</div>
                      <div style={{ opacity: 0.85 }}>{evening.startTime} - {evening.endTime}</div>
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const RoleRowView = ({ roles }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Role</th>
          {days.map(day => (
            <th key={day} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ccc' }}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {roles.map(roleName => (
          <tr key={roleName}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ccc', whiteSpace: 'nowrap' }}>
              <span style={{
                backgroundColor: roleColors[roleName],
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {roleName}
              </span>
            </td>
            {days.map(day => {
              const morning = scheduleData.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'AM'
              })
              const evening = scheduleData.filter(s => {
                if (s.role !== roleName || s.day !== day) return false
                return s.startTime.split(' ')[1] === 'PM'
              })
              return (
                <td key={day} style={{ padding: '4px', borderBottom: '1px solid #ccc', verticalAlign: 'top', minWidth: '90px' }}>
                  <div style={{ borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '4px' }}>
                    {morning.length > 0
                      ? morning.map(s => <div key={s.id} style={{ fontSize: '11px' }}>{s.employee}</div>)
                      : <div style={{ color: '#ccc', fontSize: '11px' }}>—</div>
                    }
                  </div>
                  <div>
                    {evening.length > 0
                      ? evening.map(s => <div key={s.id} style={{ fontSize: '11px' }}>{s.employee}</div>)
                      : <div style={{ color: '#ccc', fontSize: '11px' }}>—</div>
                    }
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

function ScheduleGrid({ role, isGenerated, setIsGenerated, isPublished, setIsPublished }) {
  const [view, setView] = useState('list')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsGenerated(true)
    }, 2000)
  }

  const employees = [...new Set(scheduleData.map(shift => shift.employee))].sort()

  const roleOrder = ['Manager', 'Shift Lead', 'Cook', 'Host', 'Server', 'Bartender']
  const roles = [...new Set(scheduleData.map(shift => shift.role))].sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b))

  const getWeekLabel = () => {
    const start = new Date()
    start.setDate(start.getDate() + weekOffset * 7)
    return `Week of ${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const getShifts = (day, period) => {
    return scheduleData.filter(shift =>
      shift.day === day &&
      (period === 'Morning' ? shift.startTime === '10:00 AM' : shift.startTime === '4:00 PM')
    )
  }

  return (
    <div>
      {/* Generate screen — shows when schedule hasn't been generated yet */}
      {!isGenerated && (
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', paddingTop: '48px' }}>
          <h2 style={{ marginBottom: '8px' }}>Generate Schedule</h2>
          <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>
            Review the inputs below and click Generate to produce this week's schedule.
          </p>

          {/* Inputs */}
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Week
              </label>
              <input
                type="text"
                defaultValue="Mar 24 - Mar 30, 2026"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Projected weekly sales
              </label>
              <input
                type="text"
                defaultValue="$24,500"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Staffing rules
              </label>
              <input
                type="text"
                defaultValue="Standard coverage — weekday/weekend split"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                defaultValue="Bar closed Sunday. Shift Lead required Fri/Sat evenings."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #e0e0e0', fontSize: '14px',
                  boxSizing: 'border-box', height: '80px', resize: 'none'
                }}
              />
            </div>
          </div>

          {/* Generate button */}
          {isLoading ? (
            <div style={{ fontSize: '14px', color: '#888' }}>
              ⏳ Generating schedule...
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              style={{
                backgroundColor: '#000', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '12px 32px', fontSize: '15px',
                cursor: 'pointer', fontWeight: '500'
              }}
            >
              Generate Schedule
            </button>
          )}
        </div>
      )}

      {/* Schedule — shows after generation */}
      {isGenerated && (
        <div>
          {/* Week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
              <span>{getWeekLabel()}</span>
              <button onClick={() => setWeekOffset(weekOffset + 1)}>→</button>
            </div>

            {/* Publish button — manager only */}
            {role === 'manager' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isPublished && (
                  <span style={{
                    backgroundColor: '#4CAF50', color: '#fff',
                    padding: '4px 12px', borderRadius: '20px', fontSize: '13px'
                  }}>
                    ✓ Published
                  </span>
                )}
                {!isPublished && (
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      backgroundColor: '#000', color: '#fff',
                      border: 'none', borderRadius: '8px',
                      padding: '8px 20px', fontSize: '14px',
                      cursor: 'pointer', fontWeight: '500'
                    }}
                  >
                    Publish Schedule
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button onClick={() => setView('list')}
              style={{ fontWeight: view === 'list' ? 'bold' : 'normal' }}>
              List View
            </button>
            <button onClick={() => setView('employee')}
              style={{ fontWeight: view === 'employee' ? 'bold' : 'normal' }}>
              Week View
            </button>
            {role === 'manager' && (
              <button onClick={() => setView('role')}
                style={{ fontWeight: view === 'role' ? 'bold' : 'normal' }}>
                Role View
              </button>
            )}
          </div>

          {view === 'list' && <ListView getShifts={getShifts} />}
          {view === 'employee' && <EmployeeRowView employees={employees} />}
          {view === 'role' && <RoleRowView roles={roles} />}
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 8px' }}>Publish Schedule?</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              This will notify all employees of the schedule for the week of Mar 24 - Mar 30, 2026.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  border: '1px solid #e0e0e0', backgroundColor: '#fff',
                  fontSize: '14px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPublished(true)
                  setShowModal(false)
                }}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  border: 'none', backgroundColor: '#000', color: '#fff',
                  fontSize: '14px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleGrid