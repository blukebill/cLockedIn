package com.clockedin.api.jobcode.dto;

public record EmployeeJobCodeResponse(
        Long id,
        Long employeeId,
        String employeeName,
        Long jobCodeId,
        String jobCodeName,
        Integer jobCodeRank
) {}
