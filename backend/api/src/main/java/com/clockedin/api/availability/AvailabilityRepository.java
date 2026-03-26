package com.clockedin.api.availability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    Optional<Availability> findByEmployeeIdAndDayOfWeek(Long employeeId, DayOfWeek dayOfWeek);

    List<Availability> findByEmployeeId(Long employeeId);

    List<Availability> findByRestaurantId(Long restaurantId);

    List<Availability> findByRestaurantIdAndEmployeeId(Long restaurantId, Long employeeId);
}
