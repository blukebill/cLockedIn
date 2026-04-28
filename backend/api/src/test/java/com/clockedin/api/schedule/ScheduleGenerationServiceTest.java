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
import com.clockedin.api.timeoff.TimeOffRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleGenerationServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private SchedulerInputSnapshotService snapshotService;

    @InjectMocks
    private ScheduleGenerationService scheduleGenerationService;

    @Test
    void generateWeekCreatesSeparateAssignedShiftsFromTemplates() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        User alex = employee(5L, restaurant, "Alex");
        User blair = employee(6L, restaurant, "Blair");
        ShiftTemplate dinner = template(20L, restaurant, server, DayOfWeek.MONDAY);
        dinner.setMinEmployees(2);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(employeeJobCode(restaurant, alex, server), employeeJobCode(restaurant, blair, server)),
                List.of(priority(restaurant, alex, server, 5), priority(restaurant, blair, server, 1)),
                List.of(availability(alex), availability(blair)),
                List.of(),
                List.of(forecast(monday, server, 2)),
                List.of(dinner),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            for (Shift shift : invocation.<Iterable<Shift>>getArgument(0)) {
                shift.setId((long) shifts.size() + 1);
                shifts.add(shift);
            }
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(2);
        assertThat(response.shifts()).extracting("employeeName").containsExactly("Blair", "Alex");
        assertThat(response.shifts()).extracting("status").containsExactly("ASSIGNED", "ASSIGNED");
        verify(shiftRepository).deleteByScheduleIdAndSource(30L, ShiftSource.GENERATED);
    }

    @Test
    void generateWeekPenalizesEmployeesWithConsecutiveSameShiftHistory() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        User alex = employee(5L, restaurant, "Alex");
        User blair = employee(6L, restaurant, "Blair");
        ShiftTemplate dinner = template(20L, restaurant, server, DayOfWeek.MONDAY);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(new SchedulerInputSnapshot(
                List.of(),
                List.of(employeeJobCode(restaurant, alex, server), employeeJobCode(restaurant, blair, server)),
                List.of(priority(restaurant, alex, server, 1), priority(restaurant, blair, server, 5)),
                List.of(availability(alex), availability(blair)),
                List.of(),
                List.of(forecast(monday, server, 1)),
                List.of(dinner),
                List.of(),
                List.of(
                        historicalShift(restaurant, schedule, dinner, alex, monday.minusWeeks(2)),
                        historicalShift(restaurant, schedule, dinner, alex, monday.minusWeeks(1))
                )
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            for (Shift shift : invocation.<Iterable<Shift>>getArgument(0)) {
                shift.setId((long) shifts.size() + 1);
                shifts.add(shift);
            }
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(1);
        assertThat(response.shifts().get(0).employeeName()).isEqualTo("Blair");
    }

    @Test
    void generateWeekPenalizesRepeatedSameShiftAssignmentsWithinGeneratedWeek() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        User alex = employee(5L, restaurant, "Alex");
        User blair = employee(6L, restaurant, "Blair");
        ShiftTemplate mondayOpen = template(20L, restaurant, server, DayOfWeek.MONDAY);
        ShiftTemplate tuesdayOpen = template(21L, restaurant, server, DayOfWeek.TUESDAY);
        ShiftTemplate wednesdayOpen = template(22L, restaurant, server, DayOfWeek.WEDNESDAY);
        List.of(mondayOpen, tuesdayOpen, wednesdayOpen).forEach(template -> {
            template.setName("Opening Server");
            template.setStartTime(LocalTime.of(10, 0));
            template.setEndTime(LocalTime.of(16, 0));
        });
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(employeeJobCode(restaurant, alex, server), employeeJobCode(restaurant, blair, server)),
                List.of(priority(restaurant, alex, server, 1), priority(restaurant, blair, server, 5)),
                List.of(
                        availability(alex, DayOfWeek.MONDAY),
                        availability(alex, DayOfWeek.TUESDAY),
                        availability(alex, DayOfWeek.WEDNESDAY),
                        availability(blair, DayOfWeek.MONDAY),
                        availability(blair, DayOfWeek.TUESDAY),
                        availability(blair, DayOfWeek.WEDNESDAY)
                ),
                List.of(),
                List.of(
                        forecast(monday, server, 1),
                        forecast(monday.plusDays(1), server, 1),
                        forecast(monday.plusDays(2), server, 1)
                ),
                List.of(mondayOpen, tuesdayOpen, wednesdayOpen),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            for (Shift shift : invocation.<Iterable<Shift>>getArgument(0)) {
                shift.setId((long) shifts.size() + 1);
                shifts.add(shift);
            }
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(3);
        assertThat(response.shifts()).extracting("employeeName").containsExactly("Alex", "Blair", "Alex");
    }

    @Test
    void generateWeekPrefersSingleSkillEmployeesForLowerRankedRoles() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 3);
        JobCode cocktail = jobCode(11L, restaurant, "CKTL", 4);
        User casey = employee(5L, restaurant, "Casey");
        User morgan = employee(6L, restaurant, "Morgan");
        ShiftTemplate serverShift = template(20L, restaurant, server, DayOfWeek.MONDAY);
        serverShift.setName("Server");
        serverShift.setMinEmployees(1);
        serverShift.setMaxEmployees(1);
        ShiftTemplate cocktailShift = template(21L, restaurant, cocktail, DayOfWeek.MONDAY);
        cocktailShift.setName("Cocktail");
        cocktailShift.setMinEmployees(1);
        cocktailShift.setMaxEmployees(1);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(
                        employeeJobCode(restaurant, casey, server),
                        employeeJobCode(restaurant, morgan, server),
                        employeeJobCode(restaurant, morgan, cocktail)
                ),
                List.of(),
                List.of(availability(casey), availability(morgan)),
                List.of(),
                List.of(forecastWithoutRequirements(monday)),
                List.of(serverShift, cocktailShift),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            for (Shift shift : invocation.<Iterable<Shift>>getArgument(0)) {
                shift.setId((long) shifts.size() + 1);
                shifts.add(shift);
            }
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(2);
        assertThat(response.shifts())
                .filteredOn(shift -> shift.jobCodeName().equals("SERVER"))
                .extracting("employeeName")
                .containsExactly("Casey");
        assertThat(response.shifts())
                .filteredOn(shift -> shift.jobCodeName().equals("CKTL"))
                .extracting("employeeName")
                .containsExactly("Morgan");
    }

    @Test
    void generateWeekLeavesShiftUnassignedWhenNoEmployeeCanWork() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        User alex = employee(5L, restaurant, "Alex");
        ShiftTemplate dinner = template(20L, restaurant, server, DayOfWeek.MONDAY);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(schedule)).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(employeeJobCode(restaurant, alex, server)),
                List.of(),
                List.of(availability(alex, LocalTime.of(9, 0), LocalTime.of(12, 0))),
                List.of(),
                List.of(forecast(monday, server, 1)),
                List.of(dinner),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            invocation.<Iterable<Shift>>getArgument(0).forEach(shifts::add);
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(1);
        assertThat(response.shifts().get(0).employeeId()).isNull();
        assertThat(response.shifts().get(0).status()).isEqualTo("UNASSIGNED");
    }

    @Test
    void generateWeekCreatesTemplateMinimumsWithoutStaffingRules() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        ShiftTemplate dinner = template(20L, restaurant, server, DayOfWeek.MONDAY);
        dinner.setMinEmployees(2);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(forecastWithoutRequirements(monday)),
                List.of(dinner),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            invocation.<Iterable<Shift>>getArgument(0).forEach(shifts::add);
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(2);
        assertThat(response.shifts()).extracting("status").containsExactly("UNASSIGNED", "UNASSIGNED");
    }

    @Test
    void generateWeekSkipsTemplateMinimumsWhenRestaurantIsClosed() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        ShiftTemplate dinner = template(20L, restaurant, server, DayOfWeek.MONDAY);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(closedForecast(monday)),
                List.of(dinner),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            invocation.<Iterable<Shift>>getArgument(0).forEach(shifts::add);
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).isEmpty();
    }

    @Test
    void generateWeekUsesProjectedHeadsToScaleEachShiftTemplate() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        ShiftTemplate lunch = template(20L, restaurant, server, DayOfWeek.MONDAY);
        lunch.setName("Lunch Server");
        lunch.setStartTime(LocalTime.of(10, 0));
        lunch.setEndTime(LocalTime.of(16, 0));
        lunch.setMinEmployees(1);
        lunch.setMaxEmployees(12);
        ShiftTemplate dinner = template(21L, restaurant, server, DayOfWeek.MONDAY);
        dinner.setName("Dinner Server");
        dinner.setStartTime(LocalTime.of(16, 0));
        dinner.setEndTime(LocalTime.of(22, 0));
        dinner.setMinEmployees(1);
        dinner.setMaxEmployees(12);
        Schedule schedule = schedule(30L, restaurant, monday);
        AtomicReference<List<Shift>> savedShifts = new AtomicReference<>(List.of());

        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(scheduleRepository.findByRestaurantIdAndStartDateAndEndDate(1L, monday, monday.plusDays(6)))
                .thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
        when(snapshotService.loadWeek(1L, monday)).thenReturn(snapshot(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(forecastWithDemand(monday, server, 120, 12)),
                List.of(lunch, dinner),
                List.of()
        ));
        when(shiftRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Shift> shifts = new ArrayList<>();
            invocation.<Iterable<Shift>>getArgument(0).forEach(shifts::add);
            savedShifts.set(shifts);
            return shifts;
        });
        when(shiftRepository.findByScheduleIdOrderByShiftDateAscStartTimeAscIdAsc(30L))
                .thenAnswer(invocation -> savedShifts.get());

        ScheduleResponse response = scheduleGenerationService.generateWeek(1L, monday);

        assertThat(response.shifts()).hasSize(10);
        assertThat(response.shifts())
                .filteredOn(shift -> shift.shiftTemplateId().equals(20L))
                .hasSize(5);
        assertThat(response.shifts())
                .filteredOn(shift -> shift.shiftTemplateId().equals(21L))
                .hasSize(5);
    }

    private SchedulerInputSnapshot snapshot(
            List<EmployeeJobCode> employeeJobCodes,
            List<EmployeeRolePriority> priorities,
            List<Availability> availability,
            List<TimeOffRequest> timeOff,
            List<ForecastResponse> forecasts,
            List<ShiftTemplate> templates,
            List<Shift> shifts
    ) {
        return new SchedulerInputSnapshot(List.of(), employeeJobCodes, priorities, availability, timeOff, forecasts, templates, shifts);
    }

    private ForecastResponse forecast(LocalDate date, JobCode jobCode, int requiredCount) {
        return new ForecastResponse(
                1L,
                date,
                BigDecimal.valueOf(1000),
                true,
                BigDecimal.valueOf(20),
                50,
                List.of(new ForecastStaffingRequirementResponse(
                        jobCode.getId(),
                        jobCode.getName(),
                        jobCode.getRank(),
                        requiredCount,
                        null,
                        null,
                        requiredCount
                ))
        );
    }

    private ForecastResponse forecastWithoutRequirements(LocalDate date) {
        return new ForecastResponse(
                1L,
                date,
                BigDecimal.valueOf(1000),
                true,
                BigDecimal.valueOf(20),
                50,
                List.of()
        );
    }

    private ForecastResponse forecastWithDemand(
            LocalDate date,
            JobCode jobCode,
            int projectedHeads,
            int headsPerEmployee
    ) {
        int requiredCount = (int) Math.ceil((double) projectedHeads / headsPerEmployee);
        return new ForecastResponse(
                1L,
                date,
                BigDecimal.valueOf(2400),
                true,
                BigDecimal.valueOf(20),
                projectedHeads,
                List.of(new ForecastStaffingRequirementResponse(
                        jobCode.getId(),
                        jobCode.getName(),
                        jobCode.getRank(),
                        0,
                        headsPerEmployee,
                        projectedHeads,
                        requiredCount
                ))
        );
    }

    private ForecastResponse closedForecast(LocalDate date) {
        return new ForecastResponse(
                1L,
                date,
                BigDecimal.ZERO,
                false,
                BigDecimal.valueOf(20),
                0,
                List.of()
        );
    }

    private Schedule schedule(Long id, Restaurant restaurant, LocalDate startDate) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setRestaurant(restaurant);
        schedule.setStartDate(startDate);
        schedule.setEndDate(startDate.plusDays(6));
        schedule.setStatus(ScheduleStatus.DRAFT);
        return schedule;
    }

    private ShiftTemplate template(Long id, Restaurant restaurant, JobCode jobCode, DayOfWeek dayOfWeek) {
        ShiftTemplate template = new ShiftTemplate();
        template.setId(id);
        template.setRestaurant(restaurant);
        template.setJobCode(jobCode);
        template.setDayOfWeek(dayOfWeek);
        template.setName("Dinner Server");
        template.setStartTime(LocalTime.of(16, 0));
        template.setEndTime(LocalTime.of(22, 0));
        template.setMinEmployees(1);
        template.setMaxEmployees(4);
        template.setActive(true);
        return template;
    }

    private Availability availability(User employee) {
        return availability(employee, LocalTime.of(8, 0), LocalTime.of(23, 0));
    }

    private Availability availability(User employee, DayOfWeek dayOfWeek) {
        return availability(employee, dayOfWeek, LocalTime.of(8, 0), LocalTime.of(23, 0));
    }

    private Availability availability(User employee, LocalTime start, LocalTime end) {
        return availability(employee, DayOfWeek.MONDAY, start, end);
    }

    private Availability availability(User employee, DayOfWeek dayOfWeek, LocalTime start, LocalTime end) {
        Availability availability = new Availability();
        availability.setEmployee(employee);
        availability.setRestaurant(employee.getRestaurant());
        availability.setDayOfWeek(dayOfWeek);
        availability.setAvailable(true);
        availability.setStartTime(start);
        availability.setEndTime(end);
        return availability;
    }

    private EmployeeJobCode employeeJobCode(Restaurant restaurant, User employee, JobCode jobCode) {
        EmployeeJobCode assignment = new EmployeeJobCode();
        assignment.setRestaurant(restaurant);
        assignment.setEmployee(employee);
        assignment.setJobCode(jobCode);
        return assignment;
    }

    private EmployeeRolePriority priority(Restaurant restaurant, User employee, JobCode jobCode, int value) {
        EmployeeRolePriority priority = new EmployeeRolePriority();
        priority.setRestaurant(restaurant);
        priority.setEmployee(employee);
        priority.setJobCode(jobCode);
        priority.setPriority(value);
        return priority;
    }

    private Shift historicalShift(
            Restaurant restaurant,
            Schedule schedule,
            ShiftTemplate template,
            User employee,
            LocalDate date
    ) {
        Shift shift = new Shift();
        shift.setSchedule(schedule);
        shift.setRestaurant(restaurant);
        shift.setJobCode(template.getJobCode());
        shift.setShiftTemplate(template);
        shift.setEmployee(employee);
        shift.setShiftDate(date);
        shift.setStartTime(template.getStartTime());
        shift.setEndTime(template.getEndTime());
        shift.setStatus(ShiftStatus.ASSIGNED);
        shift.setSource(ShiftSource.GENERATED);
        return shift;
    }

    private User employee(Long id, Restaurant restaurant, String name) {
        User user = new User();
        user.setId(id);
        user.setRestaurant(restaurant);
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@example.com");
        user.setPasswordHash("hash");
        user.setRole(Role.EMPLOYEE);
        return user;
    }

    private JobCode jobCode(Long id, Restaurant restaurant, String name, int rank) {
        JobCode jobCode = new JobCode();
        jobCode.setId(id);
        jobCode.setRestaurant(restaurant);
        jobCode.setName(name);
        jobCode.setRank(rank);
        return jobCode;
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }
}
