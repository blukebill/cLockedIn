package com.clockedin.api.staffing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface StaffingRuleRepository extends JpaRepository<StaffingRule, Long> {

    Optional<StaffingRule> findByIdAndRestaurantId(Long id, Long restaurantId);

    List<StaffingRule> findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAsc(Long restaurantId);

    List<StaffingRule> findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAsc(Long restaurantId, DayOfWeek dayOfWeek);

    Optional<StaffingRule> findByRestaurantIdAndDayOfWeekAndJobCodeId(
            Long restaurantId,
            DayOfWeek dayOfWeek,
            Long jobCodeId
    );
}
