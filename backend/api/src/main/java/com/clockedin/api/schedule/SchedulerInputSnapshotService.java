package com.clockedin.api.schedule;

import com.clockedin.api.availability.AvailabilityRepository;
import com.clockedin.api.forecast.ForecastService;
import com.clockedin.api.jobcode.EmployeeJobCodeRepository;
import com.clockedin.api.rolepriority.EmployeeRolePriorityRepository;
import com.clockedin.api.timeoff.TimeOffRequestRepository;
import com.clockedin.api.timeoff.TimeOffStatus;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchedulerInputSnapshotService {
    private static final int FAIRNESS_HISTORY_WEEKS = 8;

    private final UserRepository userRepository;
    private final EmployeeJobCodeRepository employeeJobCodeRepository;
    private final EmployeeRolePriorityRepository employeeRolePriorityRepository;
    private final AvailabilityRepository availabilityRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;
    private final ForecastService forecastService;
    private final ShiftTemplateRepository shiftTemplateRepository;
    private final PreferredShiftAssignmentRepository preferredShiftAssignmentRepository;
    private final ShiftRepository shiftRepository;

    @Transactional(readOnly = true)
    public SchedulerInputSnapshot loadWeek(Long restaurantId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        LocalDate historyStartDate = startDate.minusWeeks(FAIRNESS_HISTORY_WEEKS);
        LocalDate historyEndDate = startDate.minusDays(1);

        return new SchedulerInputSnapshot(
                userRepository.findByRestaurantIdAndRole(restaurantId, Role.EMPLOYEE),
                employeeJobCodeRepository.findByRestaurantIdOrderByEmployeeIdAsc(restaurantId),
                employeeRolePriorityRepository.findByRestaurantIdOrderByEmployeeIdAscJobCodeRankAsc(restaurantId),
                availabilityRepository.findByRestaurantId(restaurantId),
                timeOffRequestRepository.findByRestaurantIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        restaurantId,
                        TimeOffStatus.APPROVED,
                        endDate,
                        startDate
                ),
                forecastService.getWeekForecast(restaurantId, startDate),
                loadActiveTemplates(restaurantId),
                preferredShiftAssignmentRepository.findByRestaurantIdOrderByShiftTemplateDayOfWeekAscShiftTemplateStartTimeAscEmployeeNameAsc(
                        restaurantId
                ),
                shiftRepository.findByRestaurantIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                        restaurantId,
                        startDate,
                        endDate
                ),
                shiftRepository.findByRestaurantIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                        restaurantId,
                        historyStartDate,
                        historyEndDate
                )
        );
    }

    private List<ShiftTemplate> loadActiveTemplates(Long restaurantId) {
        return java.util.Arrays.stream(DayOfWeek.values())
                .flatMap(day -> shiftTemplateRepository
                        .findByRestaurantIdAndDayOfWeekAndActiveTrueOrderByJobCodeRankAscStartTimeAsc(
                                restaurantId,
                                day
                        )
                        .stream())
                .toList();
    }
}
