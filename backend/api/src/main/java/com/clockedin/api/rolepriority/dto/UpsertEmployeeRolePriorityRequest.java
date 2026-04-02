package com.clockedin.api.rolepriority.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpsertEmployeeRolePriorityRequest {

    @NotNull
    private Long employeeId;

    @NotNull
    private Long jobCodeId;

    @NotNull
    @Min(value = 0, message = "priority must be non-negative")
    private Integer priority;
}
