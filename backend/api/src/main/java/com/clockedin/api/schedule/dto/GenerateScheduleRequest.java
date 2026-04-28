package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GenerateScheduleRequest(
        @NotNull LocalDate startDate
) {
}
