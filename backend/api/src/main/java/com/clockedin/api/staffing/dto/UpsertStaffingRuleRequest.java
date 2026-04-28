package com.clockedin.api.staffing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;

@Getter
@Setter
@NoArgsConstructor
public class UpsertStaffingRuleRequest {

    private Long id;

    @NotNull
    private DayOfWeek dayOfWeek;

    @NotNull
    private Long jobCodeId;

    @Min(value = 0, message = "requiredCount must be non-negative")
    private Integer requiredCount;

    @Min(value = 1, message = "headsPerEmployee must be positive")
    private Integer headsPerEmployee;
}
