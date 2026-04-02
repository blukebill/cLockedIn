import { scheduleData } from "../constants/scheduleData";
import { roleColors } from "../constants/roleColors";
import { getWeekDates, parseShiftStart, parseShiftEnd, calculateHours } from "../utils/scheduleUtils";

const DEMO_EMPLOYEE = "Marcus J."

function EmployeeDashboard({ setPage }) {
    const weekDates = getWeekDates()
    const now = new Date()

    const myShifts = scheduleData.filter(s => s.employee === DEMO_EMPLOYEE)

    const totalHours = myShifts.reduce((sum, shift) => {
        return sum + calculateHours(shift.startTime, shift.endTime)
    }, 0)

    const totalWages = myShifts.reduce((sum, shift) => sum + shift.estimatedEarnings, 0)

    const nextShift = myShifts
      .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
      .sort((a, b) =>
        parseShiftStart(a.day, a.startTime, weekDates) -
        parseShiftStart(b.day, b.startTime, weekDates)
    )[0]

    const upcomingShifts = myShifts
      .filter(shift => parseShiftEnd(shift.day, shift.endTime, weekDates) > now)
      .sort((a, b) =>
        parseShiftStart(a.day, a.startTime, weekDates) -
        parseShiftStart(b.day, b.startTime, weekDates)
    )

    const weekLabel = (() => {
        const dates = Object.values(weekDates)
        const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric'})
        const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric'})
        return `${start} - ${end}`
    })()

    const announcements = [
        { id: 1, title: 'Holiday Hours', preview: "Hey team, we will be operating on reduced hours next Sunday..." },
        { id: 2, title: 'Schedule Posted', preview: "Next week's schedule has been posted. Please review your shifts..." },
    ]

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
                This week ({weekLabel})
            </p>
            <h1 style={{ margin: '0 0  24px', fontSize: '28px' }}>
                Welcome back, Marcus J.
            </h1>

            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {/*Weekly Hours*/}
                <div style={{
                    flex: 1, padding: '20px', borderRadius: '12px',
                    border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
                }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Hours this week</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>{totalHours} hrs</p>
                </div>
                {/*Estimated Wages*/}
                <div style={{
                    flex: 1, padding: '20px', borderRadius: '12px',
                    border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
                }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Estimated Wages</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>${totalWages}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa' }}>before tips + tax</p>
                </div>
                {/*Next Shift*/}
                <div style={{
                    flex: 1, padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' 
                }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>Next shift</p>
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

            {/* Bottom two panels */}
            <div style={{ display: 'flex', gap: '24px' }}>

                {/* Upcoming Shifts */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px' }}>Upcoming shifts</h2>
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
                            <div key={shift.id} style ={{
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
                                        {shift.role} * {shift.startTime} - {shift.endTime}
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                                    ${shift.estimatedEarnings}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Announcements */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px' }}>Announcements</h2>
                        <button
                          onClick={() => setPage('messages')}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '13px', color: '#666'
                          }}
                        >
                            View all →
                        </button>
                    </div>

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

                    <div style={{ marginTop: '16px' }}>
                        <h2 style={{ margin: '0 0 8px', fontSize: '16px' }}>New Messages</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>No new messages.</p>
                    </div>
                </div>

            </div>
        </div>
    )

}

export default EmployeeDashboard