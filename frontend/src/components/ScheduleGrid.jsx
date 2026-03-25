import { useState } from "react";
import { scheduleData } from "../constants/scheduleData";
import { days } from "../constants/days";
import { roleColors } from "../constants/roleColors";

function ScheduleGrid() {
    const [view, setView] = useState('list')
    const [weekOffset, setWeekOffset] = useState (0)

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

            {/*Week navigation */}
            <div>
                <button onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
                <span>{getWeekLabel()}</span>
                <button onClick={() => setWeekOffset(weekOffset + 1)}>→</button>
            </div>

            {/* View Toggle */}
            <div>
                <button onClick={() => setView('list')}>List View</button>
                <button disabled title="Coming Soon">Week View</button>
            </div>

            {/* List View */}
            {days.map(day => (
                <div key={day} style={{ marginBottom: '32px' }}>
                    <h2 style={{ textAlign: 'left' }}>{day}</h2>

                    {['Morning', 'Evening'].map(period => {
                        const shifts = getShifts(day, period)
                        if (shifts.length === 0) return null

                        return (
                            <div key={period}>
                                <h3 style= {{ textAlign: 'left' }}>{period}</h3>
                                {shifts.map(shift => (
                                    <div key={shift.id} style={{
                                        display: 'flex',
                                        gap: '16 px',
                                        alignItems:'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #ccc',
                                        textAlign: 'left'
                                    }}>
                                        <span
                                        style={{
                                            backgroundColor: roleColors[shift.role],
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}
                                        >
                                            {shift.role}
                                        </span>
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
}

export default ScheduleGrid