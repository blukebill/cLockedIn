package com.clockedin.api.auth;

public record LoginResponse(
        String token,
        Long userId,
        String name,
        String email,
        String role,
        Long restaurantId,
        String restaurantName
) {}
