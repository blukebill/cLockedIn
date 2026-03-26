package com.clockedin.api.auth;

public record LoginResponse(
        String token,
        Long userId,
        String email,
        String role,
        Long restaurantId
) {}
