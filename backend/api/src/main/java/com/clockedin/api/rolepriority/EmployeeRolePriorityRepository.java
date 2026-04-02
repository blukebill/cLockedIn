package com.clockedin.api.rolepriority;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRolePriorityRepository extends JpaRepository<EmployeeRolePriority, Long> {

    List<EmployeeRolePriority> findByRestaurantIdOrderByEmployeeIdAscJobCodeRankAsc(Long restaurantId);

    List<EmployeeRolePriority> findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(Long restaurantId, Long employeeId);

    Optional<EmployeeRolePriority> findByRestaurantIdAndEmployeeIdAndJobCodeId(
            Long restaurantId,
            Long employeeId,
            Long jobCodeId
    );
}
