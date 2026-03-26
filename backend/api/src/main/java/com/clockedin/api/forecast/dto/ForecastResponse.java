package com.clockedin.api.forecast.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class ForecastResponse {
    private Long id;
    private LocalDate date;
    private BigDecimal projectedSales;
}
