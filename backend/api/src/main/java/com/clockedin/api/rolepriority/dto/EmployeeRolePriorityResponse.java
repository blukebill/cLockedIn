package com.clockedin.api.rolepriority.dto;

public record EmployeeRolePriorityResponse(
        Long id,
        Long employeeId,
        String employeeName,
        Long jobCodeId,
        String jobCodeName,
        Integer jobCodeRank,
        Integer priority
) {}
