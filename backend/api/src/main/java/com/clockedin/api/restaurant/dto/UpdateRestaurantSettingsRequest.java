package com.clockedin.api.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class UpdateRestaurantSettingsRequest {

    @DecimalMin(value = "0.01", message = "averagePricePerHead must be positive")
    private BigDecimal averagePricePerHead;
}
