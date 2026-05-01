package com.clockedin.api.messaging.dto;

public record UserSummaryResponse(
        Long id,
        String name,
        String email,
        String role
) {
}
