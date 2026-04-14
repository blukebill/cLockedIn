package com.clockedin.api.forecast.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ForecastStaffingRequirementResponse {
    private String role;
    private Integer baseRequiredCount;
    private Integer headsPerEmployee;
    private Integer requiredCount;
}
