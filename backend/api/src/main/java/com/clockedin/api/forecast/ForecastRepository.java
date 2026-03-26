package com.clockedin.api.forecast;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ForecastRepository extends JpaRepository<Forecast, Long> {

    Optional<Forecast> findByRestaurantIdAndForecastDate(Long restaurantId, LocalDate forecastDate);

    List<Forecast> findByRestaurantIdAndForecastDateBetweenOrderByForecastDateAsc(
            Long restaurantId,
            LocalDate startDate,
            LocalDate endDate
    );
}
