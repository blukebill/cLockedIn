package com.clockedin.api.schedule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreferredShiftAssignmentRepository extends JpaRepository<PreferredShiftAssignment, Long> {

    List<PreferredShiftAssignment> findByRestaurantIdOrderByShiftTemplateDayOfWeekAscShiftTemplateStartTimeAscEmployeeNameAsc(
            Long restaurantId
    );

    Optional<PreferredShiftAssignment> findByIdAndRestaurantId(Long id, Long restaurantId);

    Optional<PreferredShiftAssignment> findByRestaurantIdAndEmployeeIdAndShiftTemplateId(
            Long restaurantId,
            Long employeeId,
            Long shiftTemplateId
    );
}
