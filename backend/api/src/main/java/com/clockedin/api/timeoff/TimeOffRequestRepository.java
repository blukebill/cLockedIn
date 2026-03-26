package com.clockedin.api.timeoff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, Long> {

    List<TimeOffRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TimeOffRequest> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    Optional<TimeOffRequest> findByIdAndRestaurantId(Long id, Long restaurantId);
}
