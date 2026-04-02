package com.clockedin.api.jobcode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeJobCodeRepository extends JpaRepository<EmployeeJobCode, Long> {

    Optional<EmployeeJobCode> findByRestaurantIdAndEmployeeId(Long restaurantId, Long employeeId);

    List<EmployeeJobCode> findByRestaurantIdOrderByEmployeeIdAsc(Long restaurantId);
}
