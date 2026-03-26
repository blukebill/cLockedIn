package com.clockedin.api.timeoff.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTimeOffStatusRequest(
        @NotBlank
        String status
) {}
