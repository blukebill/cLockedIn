package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record AssignShiftRequest(
        @NotNull Long employeeId
) {
}
