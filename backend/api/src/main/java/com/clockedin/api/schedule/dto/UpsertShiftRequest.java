package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpsertShiftRequest(
        @NotNull Long jobCodeId,
        Long employeeId,
        @NotNull LocalDate shiftDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Boolean overrideConflicts
) {
}
