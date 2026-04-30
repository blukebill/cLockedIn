package com.clockedin.api.timeoff.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record TimeOffRequestResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        Long restaurantId,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        String reason,
        String status,
        LocalDateTime createdAt
) {}
