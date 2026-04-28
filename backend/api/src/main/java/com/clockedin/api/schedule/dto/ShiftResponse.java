package com.clockedin.api.schedule.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ShiftResponse(
        Long id,
        Long jobCodeId,
        String jobCodeName,
        Long shiftTemplateId,
        String shiftTemplateName,
        Long employeeId,
        String employeeName,
        LocalDate shiftDate,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        String source
) {
}
