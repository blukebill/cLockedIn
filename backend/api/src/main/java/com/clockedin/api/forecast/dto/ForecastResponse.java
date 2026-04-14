package com.clockedin.api.forecast.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class ForecastResponse {
    private Long id;
    private LocalDate date;
    private BigDecimal projectedSales;
    private BigDecimal averagePricePerHead;
    private Integer projectedHeads;
    private List<ForecastStaffingRequirementResponse> staffingRequirements;
}
