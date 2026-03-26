package com.clockedin.api.forecast;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.forecast.dto.UpsertForecastRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/forecasts")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/{date}")
    public ForecastResponse upsertForecast(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody UpsertForecastRequest request,
            Authentication authentication
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long restaurantId = userDetails.getRestaurantId();

        return forecastService.upsertForecast(restaurantId, date, request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/week")
    public List<ForecastResponse> getWeekForecast(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            Authentication authentication
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long restaurantId = userDetails.getRestaurantId();

        LocalDate effectiveStartDate = (startDate != null) ? startDate : LocalDate.now();

        return forecastService.getWeekForecast(restaurantId, effectiveStartDate);
    }
}
