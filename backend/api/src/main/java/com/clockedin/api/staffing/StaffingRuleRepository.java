package com.clockedin.api.staffing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface StaffingRuleRepository extends JpaRepository<StaffingRule, Long> {

    List<StaffingRule> findByRestaurantIdOrderByDayOfWeekAscRoleAsc(Long restaurantId);

    List<StaffingRule> findByRestaurantIdAndDayOfWeekOrderByRoleAsc(Long restaurantId, DayOfWeek dayOfWeek);

    Optional<StaffingRule> findByRestaurantIdAndDayOfWeekAndRole(Long restaurantId, DayOfWeek dayOfWeek, String role);
}
