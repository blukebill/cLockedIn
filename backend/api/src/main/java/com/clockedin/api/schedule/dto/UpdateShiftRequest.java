package com.clockedin.api.schedule.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateShiftRequest(
        Long jobCodeId,
        Long employeeId,
        LocalDate shiftDate,
        LocalTime startTime,
        LocalTime endTime
) {
}
