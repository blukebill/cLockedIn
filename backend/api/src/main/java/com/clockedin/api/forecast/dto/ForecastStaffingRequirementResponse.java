package com.clockedin.api.forecast.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ForecastStaffingRequirementResponse {
    private Long jobCodeId;
    private String jobCodeName;
    private Integer jobCodeRank;
    private Integer baseRequiredCount;
    private Integer headsPerEmployee;
    private Integer projectedHeads;
    private Integer requiredCount;
}
