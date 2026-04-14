package com.clockedin.api.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class RestaurantSettingsResponse {
    private Long id;
    private String name;
    private BigDecimal averagePricePerHead;
}
