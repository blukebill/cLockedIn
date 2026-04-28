package com.clockedin.api.timeoff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, Long> {

    List<TimeOffRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TimeOffRequest> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<TimeOffRequest> findByRestaurantIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long restaurantId,
            TimeOffStatus status,
            LocalDate endDate,
            LocalDate startDate
    );

    Optional<TimeOffRequest> findByIdAndRestaurantId(Long id, Long restaurantId);
}
