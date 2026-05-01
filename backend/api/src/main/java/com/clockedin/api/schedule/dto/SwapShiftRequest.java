package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record SwapShiftRequest(
        @NotNull Long targetShiftId,
        Boolean overrideConflicts
) {
}
