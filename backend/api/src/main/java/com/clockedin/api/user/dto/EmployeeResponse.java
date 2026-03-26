package com.clockedin.api.user.dto;

public record EmployeeResponse(
        Long id,
        String name,
        String email,
        String role,
        Long restaurantId,
        boolean enabled
) {}
