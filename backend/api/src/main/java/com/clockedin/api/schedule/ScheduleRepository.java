package com.clockedin.api.schedule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByRestaurantIdAndStartDateAndEndDate(Long restaurantId, LocalDate startDate, LocalDate endDate);

    Optional<Schedule> findByIdAndRestaurantId(Long id, Long restaurantId);

    List<Schedule> findByRestaurantIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateAsc(
            Long restaurantId,
            LocalDate endDate,
            LocalDate startDate
    );
}
