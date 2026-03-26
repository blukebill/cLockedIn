package com.clockedin.api.forecast.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class UpsertForecastRequest {

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true, message = "projectedSales must be non-negative")
    private BigDecimal projectedSales;
}
