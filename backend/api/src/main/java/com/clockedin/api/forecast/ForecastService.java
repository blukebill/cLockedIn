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
        forecast.setOpen(request.getOpen());

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
        Integer projectedHeads = forecast.isOpen()
                ? calculateProjectedHeads(forecast.getProjectedSales(), averagePricePerHead)
                : Integer.valueOf(0);
        List<StaffingRule> staffingRules = forecast.isOpen()
                ? staffingRuleRepository
                .findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAsc(
                        forecast.getRestaurantId(),
                        forecast.getForecastDate().getDayOfWeek()
                )
                : List.of();
        List<ForecastStaffingRequirementResponse> staffingRequirements = staffingRules
                .stream()
                .map(rule -> toStaffingRequirement(
                        rule,
                        calculateProjectedHeadsForRule(forecast.getProjectedSales(), averagePricePerHead, staffingRules.size())
                ))
                .toList();

        return new ForecastResponse(
                forecast.getId(),
                forecast.getForecastDate(),
                forecast.getProjectedSales(),
                forecast.isOpen(),
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

    private Integer calculateProjectedHeadsForRule(
            BigDecimal projectedSales,
            BigDecimal averagePricePerHead,
            int staffingRuleCount
    ) {
        if (staffingRuleCount == 0 || averagePricePerHead == null) {
            return null;
        }

        BigDecimal projectedSalesShare = projectedSales.divide(
                BigDecimal.valueOf(staffingRuleCount),
                2,
                RoundingMode.HALF_UP
        );
        return calculateProjectedHeads(projectedSalesShare, averagePricePerHead);
    }

    private ForecastStaffingRequirementResponse toStaffingRequirement(StaffingRule rule, Integer projectedHeads) {
        Integer perHeadRequiredCount = calculatePerHeadRequiredCount(projectedHeads, rule.getHeadsPerEmployee());
        Integer requiredCount = perHeadRequiredCount == null ? 0 : perHeadRequiredCount;

        return new ForecastStaffingRequirementResponse(
                rule.getJobCode().getId(),
                rule.getJobCode().getName(),
                rule.getJobCode().getRank(),
                0,
                rule.getHeadsPerEmployee(),
                projectedHeads,
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
