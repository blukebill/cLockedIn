package com.clockedin.api.schedule;

import com.clockedin.api.availability.Availability;
import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.jobcode.EmployeeJobCode;
import com.clockedin.api.rolepriority.EmployeeRolePriority;
import com.clockedin.api.timeoff.TimeOffRequest;
import com.clockedin.api.user.User;

import java.util.Collections;
import java.util.List;

public record SchedulerInputSnapshot(
        List<User> employees,
        List<EmployeeJobCode> employeeJobCodes,
        List<EmployeeRolePriority> rolePriorities,
        List<Availability> availability,
        List<TimeOffRequest> approvedTimeOff,
        List<ForecastResponse> forecasts,
        List<ShiftTemplate> shiftTemplates,
        List<Shift> existingShifts,
        List<Shift> historicalShifts
) {
    public SchedulerInputSnapshot(
            List<User> employees,
            List<EmployeeJobCode> employeeJobCodes,
            List<EmployeeRolePriority> rolePriorities,
            List<Availability> availability,
            List<TimeOffRequest> approvedTimeOff,
            List<ForecastResponse> forecasts,
            List<ShiftTemplate> shiftTemplates,
            List<Shift> existingShifts
    ) {
        this(
                employees,
                employeeJobCodes,
                rolePriorities,
                availability,
                approvedTimeOff,
                forecasts,
                shiftTemplates,
                existingShifts,
                Collections.emptyList()
        );
    }
}
