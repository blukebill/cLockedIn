package com.clockedin.api.auth;

public record MeResponse(
        Long userId,
        String name,
        String email,
        String role,
        Long restaurantId,
        String restaurantName
) {}
