package com.clockedin.api.schedule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    List<Shift> findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(Long scheduleId);

    List<Shift> findByRestaurantIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
            Long restaurantId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Shift> findByRestaurantIdAndEmployeeIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAscIdAsc(
            Long restaurantId,
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate
    );

    void deleteByScheduleIdAndSource(Long scheduleId, ShiftSource source);
}
