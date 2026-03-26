package com.clockedin.api.timeoff.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TimeOffRequestResponse(
        Long id,
        Long userId,
        String userEmail,
        Long restaurantId,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        String status,
        LocalDateTime createdAt
) {}
