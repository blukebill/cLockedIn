package com.clockedin.api.jobcode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeJobCodeRepository extends JpaRepository<EmployeeJobCode, Long> {

    Optional<EmployeeJobCode> findByRestaurantIdAndEmployeeIdAndJobCodeId(
            Long restaurantId,
            Long employeeId,
            Long jobCodeId
    );

    List<EmployeeJobCode> findByRestaurantIdOrderByEmployeeIdAsc(Long restaurantId);

    List<EmployeeJobCode> findByRestaurantIdAndJobCodeIdOrderByEmployeeIdAsc(Long restaurantId, Long jobCodeId);

    List<EmployeeJobCode> findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(Long restaurantId, Long employeeId);

    void deleteByRestaurantIdAndEmployeeIdAndJobCodeId(Long restaurantId, Long employeeId, Long jobCodeId);
}
