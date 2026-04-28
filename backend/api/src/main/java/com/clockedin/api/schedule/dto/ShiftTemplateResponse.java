package com.clockedin.api.schedule.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record ShiftTemplateResponse(
        Long id,
        Long jobCodeId,
        String jobCodeName,
        Integer jobCodeRank,
        DayOfWeek dayOfWeek,
        String name,
        LocalTime startTime,
        LocalTime endTime,
        Integer minEmployees,
        Integer maxEmployees,
        boolean active
) {
}
