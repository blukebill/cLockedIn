package com.clockedin.api.schedule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface ShiftTemplateRepository extends JpaRepository<ShiftTemplate, Long> {

    List<ShiftTemplate> findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAscStartTimeAsc(Long restaurantId);

    List<ShiftTemplate> findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAscStartTimeAsc(
            Long restaurantId,
            DayOfWeek dayOfWeek
    );

    List<ShiftTemplate> findByRestaurantIdAndDayOfWeekAndActiveTrueOrderByJobCodeRankAscStartTimeAsc(
            Long restaurantId,
            DayOfWeek dayOfWeek
    );

    Optional<ShiftTemplate> findByIdAndRestaurantId(Long id, Long restaurantId);
}
