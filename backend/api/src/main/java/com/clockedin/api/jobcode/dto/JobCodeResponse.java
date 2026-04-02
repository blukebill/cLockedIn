package com.clockedin.api.jobcode.dto;

public record JobCodeResponse(
        Long id,
        String name,
        Integer rank
) {}
