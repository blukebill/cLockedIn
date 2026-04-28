package com.clockedin.api.schedule.dto;

import java.time.LocalDate;
import java.util.List;

public record ScheduleResponse(
        Long id,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        List<ShiftResponse> shifts
) {
}
