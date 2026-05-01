package com.clockedin.api.schedule;

import com.clockedin.api.jobcode.EmployeeJobCodeRepository;
import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.schedule.dto.ScheduleResponse;
import com.clockedin.api.schedule.dto.ShiftResponse;
import com.clockedin.api.schedule.dto.UpdateShiftRequest;
import com.clockedin.api.schedule.dto.UpsertShiftRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ShiftRepository shiftRepository;
    private final RestaurantRepository restaurantRepository;
    private final JobCodeRepository jobCodeRepository;
    private final UserRepository userRepository;
    private final EmployeeJobCodeRepository employeeJobCodeRepository;

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedules(Long restaurantId, LocalDate startDate, LocalDate endDate) {
        return scheduleRepository
                .findByRestaurantIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateAsc(
                        restaurantId,
                        endDate,
                        startDate
                )
                .stream()
                .map(this::toResponseWithShifts)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getWeek(Long restaurantId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        Schedule schedule = scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(restaurantId, startDate, endDate)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        return toResponseWithShifts(schedule);
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getById(Long restaurantId, Long scheduleId) {
        return toResponseWithShifts(findSchedule(restaurantId, scheduleId));
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getPublishedWeek(Long restaurantId, LocalDate startDate) {
        Schedule schedule = scheduleRepository
                .findByRestaurantIdAndStartDateAndEndDate(restaurantId, startDate, startDate.plusDays(6))
                .filter(existing -> existing.getStatus() == ScheduleStatus.PUBLISHED)
                .orElseThrow(() -> new EntityNotFoundException("Published schedule not found"));

        return toResponseWithShifts(schedule);
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getMyWeek(Long restaurantId, Long employeeId, LocalDate startDate) {
        Schedule schedule = scheduleRepository
                .findByRestaurantIdAndStartDateAndEndDate(restaurantId, startDate, startDate.plusDays(6))
                .filter(existing -> existing.getStatus() == ScheduleStatus.PUBLISHED)
                .orElseThrow(() -> new EntityNotFoundException("Published schedule not found"));

        List<Shift> shifts = shiftRepository
                .findByRestaurantIdAndEmployeeIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAscIdAsc(
                        restaurantId,
                        employeeId,
                        schedule.getStartDate(),
                        schedule.getEndDate()
                )
                .stream()
                .filter(shift -> shift.getSchedule().getId().equals(schedule.getId()))
                .toList();

        return toResponse(schedule, shifts);
    }

    @Transactional
    public ScheduleResponse publish(Long restaurantId, Long scheduleId) {
        Schedule schedule = findSchedule(restaurantId, scheduleId);
        schedule.setStatus(ScheduleStatus.PUBLISHED);
        return toResponseWithShifts(scheduleRepository.save(schedule));
    }

    @Transactional
    public ScheduleResponse reopen(Long restaurantId, Long scheduleId) {
        Schedule schedule = findSchedule(restaurantId, scheduleId);
        schedule.setStatus(ScheduleStatus.DRAFT);
        return toResponseWithShifts(scheduleRepository.save(schedule));
    }

    @Transactional
    public ShiftResponse createShift(Long restaurantId, Long scheduleId, UpsertShiftRequest request) {
        Schedule schedule = findEditableSchedule(restaurantId, scheduleId);
        validateTimes(request.startTime(), request.endTime());
        validateDateInSchedule(schedule, request.shiftDate());

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
        JobCode jobCode = findJobCode(restaurantId, request.jobCodeId());
        User employee = request.employeeId() == null
                ? null
                : findAssignableEmployee(
                        restaurantId,
                        request.employeeId(),
                        jobCode.getId(),
                        Boolean.TRUE.equals(request.overrideConflicts())
                );

        Shift shift = new Shift();
        shift.setSchedule(schedule);
        shift.setRestaurant(restaurant);
        shift.setJobCode(jobCode);
        shift.setEmployee(employee);
        shift.setShiftDate(request.shiftDate());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        shift.setSource(ShiftSource.MANUAL);
        shift.setStatus(employee == null ? ShiftStatus.UNASSIGNED : ShiftStatus.ASSIGNED);
        validateNoOverlap(restaurantId, shift, employee);

        return toShiftResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse updateShift(Long restaurantId, Long scheduleId, Long shiftId, UpdateShiftRequest request) {
        findEditableSchedule(restaurantId, scheduleId);
        Shift shift = findShift(restaurantId, scheduleId, shiftId);

        if (request.jobCodeId() != null) {
            shift.setJobCode(findJobCode(restaurantId, request.jobCodeId()));
        }
        if (request.shiftDate() != null) {
            validateDateInSchedule(shift.getSchedule(), request.shiftDate());
            shift.setShiftDate(request.shiftDate());
        }
        if (request.startTime() != null) {
            shift.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            shift.setEndTime(request.endTime());
        }
        validateTimes(shift.getStartTime(), shift.getEndTime());

        if (request.employeeId() != null) {
            shift.setEmployee(findAssignableEmployee(
                    restaurantId,
                    request.employeeId(),
                    shift.getJobCode().getId(),
                    Boolean.TRUE.equals(request.overrideConflicts())
            ));
        }
        shift.setStatus(shift.getEmployee() == null ? ShiftStatus.UNASSIGNED : ShiftStatus.ASSIGNED);
        validateNoOverlap(restaurantId, shift, shift.getEmployee());

        return toShiftResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse assignShift(
            Long restaurantId,
            Long scheduleId,
            Long shiftId,
            Long employeeId,
            boolean overrideConflicts
    ) {
        findEditableSchedule(restaurantId, scheduleId);
        Shift shift = findShift(restaurantId, scheduleId, shiftId);
        shift.setEmployee(findAssignableEmployee(restaurantId, employeeId, shift.getJobCode().getId(), overrideConflicts));
        shift.setStatus(ShiftStatus.ASSIGNED);
        validateNoOverlap(restaurantId, shift, shift.getEmployee());
        return toShiftResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ScheduleResponse swapShifts(
            Long restaurantId,
            Long scheduleId,
            Long sourceShiftId,
            Long targetShiftId,
            boolean overrideConflicts
    ) {
        Schedule schedule = findEditableSchedule(restaurantId, scheduleId);
        Shift sourceShift = findShift(restaurantId, scheduleId, sourceShiftId);
        Shift targetShift = findShift(restaurantId, scheduleId, targetShiftId);
        if (sourceShift.getId().equals(targetShift.getId())) {
            throw new IllegalArgumentException("Cannot swap a shift with itself");
        }

        User sourceEmployee = sourceShift.getEmployee();
        User targetEmployee = targetShift.getEmployee();
        LocalDate sourceDate = sourceShift.getShiftDate();
        LocalDate targetDate = targetShift.getShiftDate();

        User nextSourceEmployee = targetEmployee == null
                ? null
                : findAssignableEmployee(
                        restaurantId,
                        targetEmployee.getId(),
                        sourceShift.getJobCode().getId(),
                        overrideConflicts
                );
        User nextTargetEmployee = sourceEmployee == null
                ? null
                : findAssignableEmployee(
                        restaurantId,
                        sourceEmployee.getId(),
                        targetShift.getJobCode().getId(),
                        overrideConflicts
                );

        sourceShift.setEmployee(nextSourceEmployee);
        sourceShift.setShiftDate(targetDate);
        sourceShift.setStatus(nextSourceEmployee == null ? ShiftStatus.UNASSIGNED : ShiftStatus.ASSIGNED);
        targetShift.setEmployee(nextTargetEmployee);
        targetShift.setShiftDate(sourceDate);
        targetShift.setStatus(nextTargetEmployee == null ? ShiftStatus.UNASSIGNED : ShiftStatus.ASSIGNED);

        Set<Long> swappedShiftIds = Set.of(sourceShift.getId(), targetShift.getId());
        validateNoOverlap(restaurantId, sourceShift, nextSourceEmployee, swappedShiftIds);
        validateNoOverlap(restaurantId, targetShift, nextTargetEmployee, swappedShiftIds);

        shiftRepository.save(sourceShift);
        shiftRepository.save(targetShift);
        return toResponseWithShifts(schedule);
    }

    @Transactional
    public ShiftResponse clearAssignment(Long restaurantId, Long scheduleId, Long shiftId) {
        findEditableSchedule(restaurantId, scheduleId);
        Shift shift = findShift(restaurantId, scheduleId, shiftId);
        shift.setEmployee(null);
        shift.setStatus(ShiftStatus.UNASSIGNED);
        return toShiftResponse(shiftRepository.save(shift));
    }

    @Transactional
    public void deleteShift(Long restaurantId, Long scheduleId, Long shiftId) {
        findEditableSchedule(restaurantId, scheduleId);
        shiftRepository.delete(findShift(restaurantId, scheduleId, shiftId));
    }

    @Transactional
    public ScheduleResponse copyWeek(Long restaurantId, Long sourceScheduleId, LocalDate targetStartDate) {
        Schedule sourceSchedule = findSchedule(restaurantId, sourceScheduleId);
        LocalDate targetEndDate = targetStartDate.plusDays(6);
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));

        Schedule targetSchedule = scheduleRepository
                .findByRestaurantIdAndStartDateAndEndDate(restaurantId, targetStartDate, targetEndDate)
                .orElseGet(() -> {
                    Schedule schedule = new Schedule();
                    schedule.setRestaurant(restaurant);
                    schedule.setStartDate(targetStartDate);
                    schedule.setEndDate(targetEndDate);
                    schedule.setStatus(ScheduleStatus.DRAFT);
                    return schedule;
                });

        if (targetSchedule.getStatus() == ScheduleStatus.PUBLISHED) {
            throw new IllegalArgumentException("Published target schedules must be reopened before copying into them");
        }

        targetSchedule.setStatus(ScheduleStatus.DRAFT);
        Schedule savedTarget = scheduleRepository.save(targetSchedule);
        List<Shift> existingTargetShifts = shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(savedTarget.getId());
        shiftRepository.deleteAll(existingTargetShifts);

        long daysToShift = ChronoUnit.DAYS.between(sourceSchedule.getStartDate(), targetStartDate);
        List<Shift> sourceShifts = shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(sourceScheduleId);
        List<Shift> copiedShifts = new ArrayList<>();

        for (Shift sourceShift : sourceShifts) {
            Shift copied = new Shift();
            copied.setSchedule(savedTarget);
            copied.setRestaurant(restaurant);
            copied.setJobCode(sourceShift.getJobCode());
            copied.setShiftTemplate(sourceShift.getShiftTemplate());
            copied.setEmployee(sourceShift.getEmployee());
            copied.setShiftDate(sourceShift.getShiftDate().plusDays(daysToShift));
            copied.setStartTime(sourceShift.getStartTime());
            copied.setEndTime(sourceShift.getEndTime());
            copied.setStatus(sourceShift.getEmployee() == null ? ShiftStatus.UNASSIGNED : ShiftStatus.ASSIGNED);
            copied.setSource(ShiftSource.MANUAL);
            copiedShifts.add(copied);
        }

        shiftRepository.saveAll(copiedShifts);
        return toResponse(
                savedTarget,
                shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(savedTarget.getId())
        );
    }

    public ScheduleResponse toResponse(Schedule schedule, List<Shift> shifts) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.getStatus().name(),
                shifts.stream().map(this::toShiftResponse).toList()
        );
    }

    private ScheduleResponse toResponseWithShifts(Schedule schedule) {
        return toResponse(schedule, shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(schedule.getId()));
    }

    private ShiftResponse toShiftResponse(Shift shift) {
        return new ShiftResponse(
                shift.getId(),
                shift.getJobCode().getId(),
                shift.getJobCode().getName(),
                shift.getShiftTemplate() == null ? null : shift.getShiftTemplate().getId(),
                shift.getShiftTemplate() == null ? null : shift.getShiftTemplate().getName(),
                shift.getEmployee() == null ? null : shift.getEmployee().getId(),
                shift.getEmployee() == null ? null : shift.getEmployee().getName(),
                shift.getShiftDate(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus().name(),
                shift.getSource().name()
        );
    }

    private Schedule findSchedule(Long restaurantId, Long scheduleId) {
        return scheduleRepository.findByIdAndRestaurantId(scheduleId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
    }

    private Schedule findEditableSchedule(Long restaurantId, Long scheduleId) {
        Schedule schedule = findSchedule(restaurantId, scheduleId);
        if (schedule.getStatus() == ScheduleStatus.PUBLISHED) {
            throw new IllegalArgumentException("Published schedules must be reopened before editing");
        }
        return schedule;
    }

    private Shift findShift(Long restaurantId, Long scheduleId, Long shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new EntityNotFoundException("Shift not found"));
        if (!shift.getRestaurant().getId().equals(restaurantId) || !shift.getSchedule().getId().equals(scheduleId)) {
            throw new EntityNotFoundException("Shift not found");
        }
        return shift;
    }

    private JobCode findJobCode(Long restaurantId, Long jobCodeId) {
        return jobCodeRepository.findByIdAndRestaurantId(jobCodeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));
    }

    private User findAssignableEmployee(Long restaurantId, Long employeeId, Long jobCodeId, boolean overrideConflicts) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .filter(User::isEnabled)
                .filter(user -> user.getRole() == Role.EMPLOYEE || user.getRole() == Role.MANAGER)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (!overrideConflicts) {
            employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(restaurantId, employeeId, jobCodeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee is not assigned to this job code"));
        }

        return employee;
    }

    private void validateDateInSchedule(Schedule schedule, LocalDate shiftDate) {
        if (shiftDate.isBefore(schedule.getStartDate()) || shiftDate.isAfter(schedule.getEndDate())) {
            throw new IllegalArgumentException("Shift date must be within the schedule week");
        }
    }

    private void validateTimes(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Shift start time must be before end time");
        }
    }

    private void validateNoOverlap(Long restaurantId, Shift shift, User employee) {
        validateNoOverlap(restaurantId, shift, employee, shift.getId() == null ? Set.of() : Set.of(shift.getId()));
    }

    private void validateNoOverlap(Long restaurantId, Shift shift, User employee, Set<Long> ignoredShiftIds) {
        if (employee == null) {
            return;
        }

        boolean overlaps = shiftRepository
                .findByRestaurantIdAndEmployeeIdAndShiftDateBetweenOrderByShiftDateAscStartTimeAscIdAsc(
                        restaurantId,
                        employee.getId(),
                        shift.getShiftDate(),
                        shift.getShiftDate()
                )
                .stream()
                .filter(existing -> !ignoredShiftIds.contains(existing.getId()))
                .anyMatch(existing -> overlaps(existing.getStartTime(), existing.getEndTime(), shift.getStartTime(), shift.getEndTime()));

        if (overlaps) {
            throw new IllegalArgumentException("Employee already has an overlapping shift");
        }
    }

    private boolean overlaps(LocalTime firstStart, LocalTime firstEnd, LocalTime secondStart, LocalTime secondEnd) {
        return firstStart.isBefore(secondEnd) && secondStart.isBefore(firstEnd);
    }
}
