package com.clockedin.api.auth;

public record MeResponse(
        Long userId,
        String email,
        String role,
        Long restaurantId
) {}
