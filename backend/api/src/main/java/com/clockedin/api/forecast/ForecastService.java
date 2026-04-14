package com.clockedin.api.forecast;

import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.forecast.dto.ForecastStaffingRequirementResponse;
import com.clockedin.api.forecast.dto.UpsertForecastRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.staffing.StaffingRule;
import com.clockedin.api.staffing.StaffingRuleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ForecastRepository forecastRepository;
    private final RestaurantRepository restaurantRepository;
    private final StaffingRuleRepository staffingRuleRepository;

    public ForecastResponse upsertForecast(Long restaurantId, LocalDate date, UpsertForecastRequest request) {
        Forecast forecast = forecastRepository
                .findByRestaurantIdAndForecastDate(restaurantId, date)
                .orElseGet(() -> {
                    Forecast newForecast = new Forecast();
                    newForecast.setRestaurantId(restaurantId);
                    newForecast.setForecastDate(date);
                    return newForecast;
                });

        forecast.setProjectedSales(request.getProjectedSales());

        Forecast saved = forecastRepository.save(forecast);
        return toResponse(saved, getAveragePricePerHead(restaurantId));
    }

    public List<ForecastResponse> getWeekForecast(Long restaurantId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        BigDecimal averagePricePerHead = getAveragePricePerHead(restaurantId);

        return forecastRepository
                .findByRestaurantIdAndForecastDateBetweenOrderByForecastDateAsc(
                        restaurantId,
                        startDate,
                        endDate
                )
                .stream()
                .map(forecast -> toResponse(forecast, averagePricePerHead))
                .toList();
    }

    private ForecastResponse toResponse(Forecast forecast, BigDecimal averagePricePerHead) {
        Integer projectedHeads = calculateProjectedHeads(forecast.getProjectedSales(), averagePricePerHead);
        List<ForecastStaffingRequirementResponse> staffingRequirements = staffingRuleRepository
                .findByRestaurantIdAndDayOfWeekOrderByRoleAsc(
                        forecast.getRestaurantId(),
                        forecast.getForecastDate().getDayOfWeek()
                )
                .stream()
                .map(rule -> toStaffingRequirement(rule, projectedHeads))
                .toList();

        return new ForecastResponse(
                forecast.getId(),
                forecast.getForecastDate(),
                forecast.getProjectedSales(),
                averagePricePerHead,
                projectedHeads,
                staffingRequirements
        );
    }

    private BigDecimal getAveragePricePerHead(Long restaurantId) {
        return restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"))
                .getAveragePricePerHead();
    }

    private Integer calculateProjectedHeads(BigDecimal projectedSales, BigDecimal averagePricePerHead) {
        if (averagePricePerHead == null) {
            return null;
        }

        return projectedSales.divide(averagePricePerHead, 0, RoundingMode.CEILING).intValue();
    }

    private ForecastStaffingRequirementResponse toStaffingRequirement(StaffingRule rule, Integer projectedHeads) {
        Integer perHeadRequiredCount = calculatePerHeadRequiredCount(projectedHeads, rule.getHeadsPerEmployee());
        Integer requiredCount = perHeadRequiredCount == null
                ? rule.getRequiredCount()
                : Math.max(rule.getRequiredCount(), perHeadRequiredCount);

        return new ForecastStaffingRequirementResponse(
                rule.getRole(),
                rule.getRequiredCount(),
                rule.getHeadsPerEmployee(),
                requiredCount
        );
    }

    private Integer calculatePerHeadRequiredCount(Integer projectedHeads, Integer headsPerEmployee) {
        if (projectedHeads == null || headsPerEmployee == null) {
            return null;
        }

        return BigDecimal.valueOf(projectedHeads)
                .divide(BigDecimal.valueOf(headsPerEmployee), 0, RoundingMode.CEILING)
                .intValue();
    }
}
