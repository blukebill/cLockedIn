package com.clockedin.api.timeoff.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateTimeOffRequest(

        @NotNull
        @FutureOrPresent
        LocalDate startDate,

        @NotNull
        @FutureOrPresent
        LocalDate endDate,

        @NotNull
        LocalTime startTime,

        @NotNull
        LocalTime endTime,

        @Size(max = 500)
        String reason
) {}
