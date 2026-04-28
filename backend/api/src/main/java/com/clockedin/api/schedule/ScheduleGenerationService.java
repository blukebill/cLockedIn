package com.clockedin.api.schedule;

import com.clockedin.api.availability.Availability;
import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.forecast.dto.ForecastStaffingRequirementResponse;
import com.clockedin.api.jobcode.EmployeeJobCode;
import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.rolepriority.EmployeeRolePriority;
import com.clockedin.api.schedule.dto.ScheduleResponse;
import com.clockedin.api.schedule.dto.ShiftResponse;
import com.clockedin.api.timeoff.TimeOffRequest;
import com.clockedin.api.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScheduleGenerationService {
    private static final int DEFAULT_ROLE_PRIORITY = 1000;
    private static final int CONSECUTIVE_SAME_SHIFT_PENALTY = 100;
    private static final int HIGHER_SKILL_LOWER_ROLE_PENALTY = 250;

    private final ScheduleRepository scheduleRepository;
    private final ShiftRepository shiftRepository;
    private final RestaurantRepository restaurantRepository;
    private final SchedulerInputSnapshotService snapshotService;

    @Transactional
    public ScheduleResponse generateWeek(Long restaurantId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));

        Schedule schedule = scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(restaurantId, startDate, endDate)
                .orElseGet(() -> {
                    Schedule newSchedule = new Schedule();
                    newSchedule.setRestaurant(restaurant);
                    newSchedule.setStartDate(startDate);
                    newSchedule.setEndDate(endDate);
                    newSchedule.setStatus(ScheduleStatus.DRAFT);
                    return newSchedule;
                });
        if (schedule.getStatus() == ScheduleStatus.PUBLISHED) {
            throw new IllegalArgumentException("Published schedules cannot be regenerated");
        }
        schedule.setStatus(ScheduleStatus.DRAFT);
        Schedule savedSchedule = scheduleRepository.save(schedule);

        shiftRepository.deleteByScheduleIdAndSource(savedSchedule.getId(), ShiftSource.GENERATED);

        SchedulerInputSnapshot snapshot = snapshotService.loadWeek(restaurantId, startDate);
        List<Shift> generatedShifts = buildGeneratedShifts(savedSchedule, restaurant, snapshot);
        shiftRepository.saveAll(generatedShifts);

        return toResponse(
                savedSchedule,
                shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(savedSchedule.getId())
        );
    }

    private List<Shift> buildGeneratedShifts(
            Schedule schedule,
            Restaurant restaurant,
            SchedulerInputSnapshot snapshot
    ) {
        List<Shift> generated = new ArrayList<>();

        for (ForecastResponse forecast : snapshot.forecasts()) {
            if (Boolean.FALSE.equals(forecast.getOpen())) {
                continue;
            }

            Map<Long, ForecastStaffingRequirementResponse> requirementsByJobCode = requirementsByJobCode(forecast);
            Map<Long, List<ShiftTemplate>> templatesByJobCode = templatesByJobCode(snapshot, forecast);

            for (Map.Entry<Long, List<ShiftTemplate>> entry : templatesByJobCode.entrySet()) {
                ForecastStaffingRequirementResponse requirement = requirementsByJobCode.get(entry.getKey());
                List<ShiftTemplate> templates = entry.getValue();
                Map<Long, Integer> generatedCounts = generatedCountsByTemplate(requirement, templates);

                for (ShiftTemplate template : templates) {
                    int count = generatedCounts.getOrDefault(template.getId(), templateMinimum(template));
                    for (int i = 0; i < count; i++) {
                        generated.add(createGeneratedShift(schedule, restaurant, forecast, template, snapshot, generated));
                    }
                }
            }
        }

        return generated;
    }

    private Map<Long, ForecastStaffingRequirementResponse> requirementsByJobCode(ForecastResponse forecast) {
        Map<Long, ForecastStaffingRequirementResponse> requirements = new HashMap<>();
        for (ForecastStaffingRequirementResponse requirement : forecast.getStaffingRequirements()) {
            requirements.put(requirement.getJobCodeId(), requirement);
        }
        return requirements;
    }

    private Map<Long, List<ShiftTemplate>> templatesByJobCode(SchedulerInputSnapshot snapshot, ForecastResponse forecast) {
        Map<Long, List<ShiftTemplate>> templates = new HashMap<>();
        snapshot.shiftTemplates().stream()
                .filter(template -> template.getDayOfWeek() == forecast.getDate().getDayOfWeek())
                .sorted(Comparator
                        .comparing((ShiftTemplate template) -> template.getJobCode().getRank())
                        .thenComparing(ShiftTemplate::getStartTime))
                .forEach(template -> templates
                        .computeIfAbsent(template.getJobCode().getId(), ignored -> new ArrayList<>())
                        .add(template));
        return templates;
    }

    private Map<Long, Integer> generatedCountsByTemplate(
            ForecastStaffingRequirementResponse requirement,
            List<ShiftTemplate> templates
    ) {
        if (requirement != null && requirement.getHeadsPerEmployee() != null && requirement.getProjectedHeads() != null) {
            return demandWeightedCounts(requirement, templates);
        }

        return minimumCounts(templates);
    }

    private Map<Long, Integer> demandWeightedCounts(
            ForecastStaffingRequirementResponse requirement,
            List<ShiftTemplate> templates
    ) {
        Map<Long, Integer> counts = new HashMap<>();
        int totalMinutes = templates.stream().mapToInt(this::templateDurationMinutes).sum();
        if (totalMinutes <= 0) {
            return minimumCounts(templates);
        }

        for (ShiftTemplate template : templates) {
            double templateShare = (double) templateDurationMinutes(template) / totalMinutes;
            int projectedHeadsForTemplate = (int) Math.ceil(requirement.getProjectedHeads() * templateShare);
            int demandCount = (int) Math.ceil((double) projectedHeadsForTemplate / requirement.getHeadsPerEmployee());
            counts.put(template.getId(), clamp(demandCount, templateMinimum(template), templateMaximum(template)));
        }

        return counts;
    }

    private Map<Long, Integer> minimumCounts(List<ShiftTemplate> templates) {
        Map<Long, Integer> counts = new HashMap<>();

        for (ShiftTemplate template : templates) {
            int count = templateMinimum(template);
            counts.put(template.getId(), count);
        }

        return counts;
    }

    private int templateMinimum(ShiftTemplate template) {
        return Math.min(
                Math.max(0, valueOrZero(template.getMinEmployees())),
                Math.max(0, valueOrZero(template.getMaxEmployees()))
        );
    }

    private int templateAdditionalCapacity(ShiftTemplate template) {
        return Math.max(0, valueOrZero(template.getMaxEmployees()) - templateMinimum(template));
    }

    private int templateMaximum(ShiftTemplate template) {
        return Math.max(0, valueOrZero(template.getMaxEmployees()));
    }

    private int templateDurationMinutes(ShiftTemplate template) {
        return Math.max(0, (int) ChronoUnit.MINUTES.between(template.getStartTime(), template.getEndTime()));
    }

    private int clamp(int value, int minimum, int maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private Shift createGeneratedShift(
            Schedule schedule,
            Restaurant restaurant,
            ForecastResponse forecast,
            ShiftTemplate template,
            SchedulerInputSnapshot snapshot,
            List<Shift> generated
    ) {
        Shift shift = new Shift();
        shift.setSchedule(schedule);
        shift.setRestaurant(restaurant);
        shift.setJobCode(template.getJobCode());
        shift.setShiftTemplate(template);
        shift.setShiftDate(forecast.getDate());
        shift.setStartTime(template.getStartTime());
        shift.setEndTime(template.getEndTime());
        shift.setSource(ShiftSource.GENERATED);
        assignEmployee(shift, snapshot, generated);
        return shift;
    }

    private void assignEmployee(Shift shift, SchedulerInputSnapshot snapshot, List<Shift> generated) {
        Optional<User> employee = snapshot.employeeJobCodes().stream()
                .filter(assignment -> assignment.getJobCode().getId().equals(shift.getJobCode().getId()))
                .map(EmployeeJobCode::getEmployee)
                .filter(candidate -> isAvailable(candidate, shift, snapshot.availability()))
                .filter(candidate -> isNotOnApprovedTimeOff(candidate, shift, snapshot.approvedTimeOff()))
                .filter(candidate -> hasNoOverlap(candidate, shift, snapshot.existingShifts(), generated))
                .distinct()
                .sorted(Comparator
                        .comparingLong((User candidate) -> candidateScoreFor(candidate, shift, snapshot, generated))
                        .thenComparing(User::getId))
                .findFirst();

        shift.setEmployee(employee.orElse(null));
        shift.setStatus(employee.isPresent() ? ShiftStatus.ASSIGNED : ShiftStatus.UNASSIGNED);
    }

    private boolean isAvailable(User employee, Shift shift, List<Availability> availability) {
        return availability.stream()
                .filter(entry -> entry.getEmployee().getId().equals(employee.getId()))
                .filter(entry -> entry.getDayOfWeek() == shift.getShiftDate().getDayOfWeek())
                .filter(Availability::isAvailable)
                .anyMatch(entry -> !entry.getStartTime().isAfter(shift.getStartTime())
                        && !entry.getEndTime().isBefore(shift.getEndTime()));
    }

    private boolean isNotOnApprovedTimeOff(User employee, Shift shift, List<TimeOffRequest> approvedTimeOff) {
        return approvedTimeOff.stream()
                .filter(request -> request.getUser().getId().equals(employee.getId()))
                .noneMatch(request -> !request.getStartDate().isAfter(shift.getShiftDate())
                        && !request.getEndDate().isBefore(shift.getShiftDate()));
    }

    private boolean hasNoOverlap(
            User employee,
            Shift shift,
            List<Shift> existingShifts,
            List<Shift> generatedShifts
    ) {
        return java.util.stream.Stream.concat(existingShifts.stream(), generatedShifts.stream())
                .filter(existing -> existing.getEmployee() != null)
                .filter(existing -> existing.getEmployee().getId().equals(employee.getId()))
                .filter(existing -> existing.getShiftDate().equals(shift.getShiftDate()))
                .noneMatch(existing -> overlaps(existing.getStartTime(), existing.getEndTime(), shift.getStartTime(), shift.getEndTime()));
    }

    private boolean overlaps(LocalTime firstStart, LocalTime firstEnd, LocalTime secondStart, LocalTime secondEnd) {
        return firstStart.isBefore(secondEnd) && secondStart.isBefore(firstEnd);
    }

    private int priorityFor(User employee, Shift shift, List<EmployeeRolePriority> priorities) {
        return priorities.stream()
                .filter(priority -> priority.getEmployee().getId().equals(employee.getId()))
                .filter(priority -> priority.getJobCode().getId().equals(shift.getJobCode().getId()))
                .map(EmployeeRolePriority::getPriority)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(DEFAULT_ROLE_PRIORITY);
    }

    private long candidateScoreFor(
            User employee,
            Shift shift,
            SchedulerInputSnapshot snapshot,
            List<Shift> generatedShifts
    ) {
        long rolePriority = priorityFor(employee, shift, snapshot.rolePriorities());
        int repeatCount = consecutiveSameShiftCount(employee, shift, snapshot.historicalShifts())
                + sameWeekSameShiftCount(employee, shift, generatedShifts);
        long repeatPenalty = (long) repeatCount
                * CONSECUTIVE_SAME_SHIFT_PENALTY;
        long skillPenalty = higherSkillLowerRolePenalty(employee, shift, snapshot.employeeJobCodes());

        return rolePriority + repeatPenalty + skillPenalty;
    }

    private long higherSkillLowerRolePenalty(
            User employee,
            Shift shift,
            List<EmployeeJobCode> employeeJobCodes
    ) {
        Integer shiftRank = shift.getJobCode().getRank();
        if (shiftRank == null) {
            return 0;
        }

        int highestAssignedRank = employeeJobCodes.stream()
                .filter(assignment -> assignment.getEmployee().getId().equals(employee.getId()))
                .map(EmployeeJobCode::getJobCode)
                .map(JobCode::getRank)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(shiftRank);

        return (long) Math.max(0, highestAssignedRank - shiftRank)
                * HIGHER_SKILL_LOWER_ROLE_PENALTY;
    }

    private int sameWeekSameShiftCount(User employee, Shift shift, List<Shift> generatedShifts) {
        return (int) generatedShifts.stream()
                .filter(previous -> previous.getEmployee() != null)
                .filter(previous -> previous.getEmployee().getId().equals(employee.getId()))
                .filter(previous -> previous.getShiftDate().isBefore(shift.getShiftDate()))
                .filter(previous -> isSameShiftPattern(previous, shift))
                .count();
    }

    private int consecutiveSameShiftCount(User employee, Shift shift, List<Shift> historicalShifts) {
        int count = 0;
        List<Shift> previousSameShifts = historicalShifts.stream()
                .filter(previous -> previous.getShiftDate().isBefore(shift.getShiftDate()))
                .filter(previous -> isSameShiftPattern(previous, shift))
                .sorted(Comparator.comparing(Shift::getShiftDate).reversed())
                .toList();

        for (Shift previous : previousSameShifts) {
            if (previous.getEmployee() == null || !previous.getEmployee().getId().equals(employee.getId())) {
                break;
            }
            count++;
        }

        return count;
    }

    private boolean isSameShiftPattern(Shift previous, Shift shift) {
        Long previousTemplateId = previous.getShiftTemplate() == null ? null : previous.getShiftTemplate().getId();
        Long templateId = shift.getShiftTemplate() == null ? null : shift.getShiftTemplate().getId();

        if (previousTemplateId != null && templateId != null && previousTemplateId.equals(templateId)) {
            return true;
        }

        if (!previous.getJobCode().getId().equals(shift.getJobCode().getId())
                || !previous.getStartTime().equals(shift.getStartTime())
                || !previous.getEndTime().equals(shift.getEndTime())) {
            return false;
        }

        String previousTemplateName = templateName(previous);
        String templateName = templateName(shift);
        if (previousTemplateName != null && templateName != null) {
            return previousTemplateName.equalsIgnoreCase(templateName);
        }

        return true;
    }

    private String templateName(Shift shift) {
        if (shift.getShiftTemplate() == null || shift.getShiftTemplate().getName() == null) {
            return null;
        }

        String name = shift.getShiftTemplate().getName().trim();
        return name.isEmpty() ? null : name;
    }

    private ScheduleResponse toResponse(Schedule schedule, List<Shift> shifts) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.getStatus().name(),
                shifts.stream().map(this::toShiftResponse).toList()
        );
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
}
