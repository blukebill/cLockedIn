import { scheduleData } from "../constants/scheduleData"
import { roleColors } from "../constants/roleColors"
import { getWeekDates, parseShiftStart, parseShiftEnd, calculateHours } from "../utils/scheduleUtils";

const DEMO_MANAGER = 'Tony N.'

function ManagerDashboard({ setPage }) {
    const weekDates = getWeekDates()
    const now = new Date()

    const myShifts = scheduleData.filter(s => s.employee === DEMO_MANAGER)

    const totalPersonalHours = myShifts.reduce((sum, shift) => {
        return sum + calculateHours(shift.startTime, shift.endTime)
    }, 0)

    const totalPersonalWages = myShifts.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

    const nextShift = myShifts
      .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
      .sort((a, b) =>
        parseShiftStart(a.day, a.startTime, weekDates) -
        parseShiftEnd(b.day, b.startTime, weekDates)
    )[0]

    const upcomingShifts = myShifts
      .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
      .sort((a, b) =>
        parseShiftStart(a.day, a.startTime, weekDates) -
        parseShiftEnd(b.day, b.startTime, weekDates)
    )

    const totalTeamHours = scheduleData.reduce((sum, shift) => {
        return sum + calculateHours(shift.startTime, shift.endTime)
    }, 0)

    const totalLaborCost = scheduleData.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

    const weekLabel = (() => {
        const dates = Object.values(weekDates)
        const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric'})
        const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric'})
        return `${start} - ${end}`
    })()

    const alerts = [
        { id: 1, type: 'warning', message: 'Wednesday morning has no Host scheduled' },
        { id: 2, type: 'request', message: 'Rachel K. has requested time off Saturday, 4/11'},
    ]

    const announcements = [
        { id: 1, title: 'Holiday Hours', preview: 'Hey team, we will be operating on reduced hours next Sunday...'},
        { id: 2, title: 'Schedule Posted', preview: "Next week's schedule has been posted. Please review your shifts..."},
    ]

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
        This week ({weekLabel})
      </p>
      <h1 style={{ margin: '0 0 24px', fontSize: '28px' }}>
        Welcome back, {DEMO_MANAGER}.
      </h1>

      {/* Personal summary cards */}
      <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#888' }}>YOUR WEEK</p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Your hours this week</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>{totalPersonalHours} hrs</p>
        </div>

        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Your estimated wages</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>${totalPersonalWages}.00</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa' }}>before tips + tax</p>
        </div>

        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Your next shift</p>
          {nextShift ? (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600' }}>
                {weekDates[nextShift.day].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <span style={{
                backgroundColor: roleColors[nextShift.role],
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {nextShift.role}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                {nextShift.startTime} - {nextShift.endTime}
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '16px', color: '#aaa' }}>No upcoming shifts</p>
          )}
        </div>
      </div>

      {/* Team overview cards */}
      <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#888' }}>TEAM OVERVIEW</p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Total team hours</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>{totalTeamHours} hrs</p>
        </div>

        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Total labor cost</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>${totalLaborCost.toLocaleString()}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa' }}>estimated this week</p>
        </div>

        <div style={{
          flex: 1, padding: '20px', borderRadius: '12px',
          border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Labor percentage</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>28.4%</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa' }}>based on projected sales</p>
        </div>
      </div>

      {/* Bottom panels */}
      <div style={{ display: 'flex', gap: '24px' }}>

        {/* Upcoming personal shifts */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Your upcoming shifts</h2>
            <button
              onClick={() => setPage('schedule')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#666'
              }}
            >
              View full schedule →
            </button>
          </div>

          {upcomingShifts.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '14px' }}>No upcoming shifts this week.</p>
          ) : (
            upcomingShifts.map(shift => (
              <div key={shift.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: roleColors[shift.role], flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    {weekDates[shift.day].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                    {shift.role} · {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  ${shift.estimatedEarnings}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Alerts and announcements */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>Team alerts</h2>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              padding: '12px', borderRadius: '8px',
              border: `1px solid ${alert.type === 'warning' ? '#f5c842' : '#a8d8a8'}`,
              backgroundColor: alert.type === 'warning' ? '#fffdf0' : '#f0fff0',
              marginBottom: '10px'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {alert.type === 'warning' ? '⚠️' : '📋'} {alert.message}
              </p>
            </div>
          ))}

          <h2 style={{ margin: '16px 0 12px', fontSize: '16px' }}>Announcements</h2>
          {announcements.map(a => (
            <div key={a.id} style={{
              padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0',
              marginBottom: '10px', cursor: 'pointer', backgroundColor: '#fafafa'
            }}
              onClick={() => setPage('messages')}
            >
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '500' }}>
                ⓘ {a.title}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{a.preview}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default ManagerDashboard