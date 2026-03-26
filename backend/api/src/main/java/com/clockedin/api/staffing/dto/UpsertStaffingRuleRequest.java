package com.clockedin.api.staffing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;

@Getter
@Setter
@NoArgsConstructor
public class UpsertStaffingRuleRequest {

    @NotNull
    private DayOfWeek dayOfWeek;

    @NotBlank
    private String role;

    @NotNull
    @Min(value = 0, message = "requiredCount must be non-negative")
    private Integer requiredCount;
}
