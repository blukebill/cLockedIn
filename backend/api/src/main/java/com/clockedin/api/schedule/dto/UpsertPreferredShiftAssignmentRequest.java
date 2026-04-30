package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record UpsertPreferredShiftAssignmentRequest(
        @NotNull Long employeeId,
        @NotNull Long shiftTemplateId
) {}
