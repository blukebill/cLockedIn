package com.clockedin.api.staffing.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.DayOfWeek;

@Getter
@AllArgsConstructor
public class StaffingRuleResponse {
    private Long id;
    private DayOfWeek dayOfWeek;
    private Long jobCodeId;
    private String jobCodeName;
    private Integer jobCodeRank;
    private Integer requiredCount;
    private Integer headsPerEmployee;
}
