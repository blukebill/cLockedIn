package com.clockedin.api.schedule.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record PreferredShiftAssignmentResponse(
        Long id,
        Long employeeId,
        String employeeName,
        Long shiftTemplateId,
        String shiftTemplateName,
        Long jobCodeId,
        String jobCodeName,
        Integer jobCodeRank,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {}
