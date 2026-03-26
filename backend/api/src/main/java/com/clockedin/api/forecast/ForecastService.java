package com.clockedin.api.forecast;

import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.forecast.dto.UpsertForecastRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ForecastRepository forecastRepository;

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
        return toResponse(saved);
    }

    public List<ForecastResponse> getWeekForecast(Long restaurantId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);

        return forecastRepository
                .findByRestaurantIdAndForecastDateBetweenOrderByForecastDateAsc(
                        restaurantId,
                        startDate,
                        endDate
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ForecastResponse toResponse(Forecast forecast) {
        return new ForecastResponse(
                forecast.getId(),
                forecast.getForecastDate(),
                forecast.getProjectedSales()
        );
    }
}
