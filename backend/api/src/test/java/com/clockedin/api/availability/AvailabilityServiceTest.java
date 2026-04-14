package com.clockedin.api.availability;

import com.clockedin.api.availability.dto.AvailabilityResponse;
import com.clockedin.api.availability.dto.UpsertAvailabilityRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AvailabilityService service;

    @Test
    void availableTrueRequiresStartTime() {
        UpsertAvailabilityRequest request = availabilityRequest(DayOfWeek.MONDAY, true, null, LocalTime.NOON);

        assertThatThrownBy(() -> service.upsertMyAvailability(5L, 1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startTime and endTime are required");
    }

    @Test
    void availableTrueRequiresEndTime() {
        UpsertAvailabilityRequest request = availabilityRequest(DayOfWeek.MONDAY, true, LocalTime.of(9, 0), null);

        assertThatThrownBy(() -> service.upsertMyAvailability(5L, 1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startTime and endTime are required");
    }

    @Test
    void availableFalseClearsTimes() {
        User employee = user(5L, restaurant(1L));
        Availability existing = availability(employee, DayOfWeek.MONDAY, true);
        existing.setStartTime(LocalTime.of(9, 0));
        existing.setEndTime(LocalTime.of(17, 0));
        when(userRepository.findById(5L)).thenReturn(Optional.of(employee));
        when(availabilityRepository.findByEmployeeIdAndDayOfWeek(5L, DayOfWeek.MONDAY)).thenReturn(Optional.of(existing));
        when(availabilityRepository.save(existing)).thenReturn(existing);

        AvailabilityResponse response = service.upsertMyAvailability(
                5L,
                1L,
                availabilityRequest(DayOfWeek.MONDAY, false, LocalTime.of(9, 0), LocalTime.of(17, 0))
        );

        assertThat(response.isAvailable()).isFalse();
        assertThat(response.getStartTime()).isNull();
        assertThat(response.getEndTime()).isNull();
    }

    @Test
    void myAvailabilityIsSortedByDay() {
        User employee = user(5L, restaurant(1L));
        when(availabilityRepository.findByEmployeeId(5L)).thenReturn(List.of(
                availability(employee, DayOfWeek.FRIDAY, true),
                availability(employee, DayOfWeek.MONDAY, true)
        ));

        List<AvailabilityResponse> responses = service.getMyAvailability(5L);

        assertThat(responses).extracting(AvailabilityResponse::getDayOfWeek)
                .containsExactly(DayOfWeek.MONDAY, DayOfWeek.FRIDAY);
    }

    @Test
    void restaurantAvailabilityIsSortedByEmployeeThenDay() {
        Restaurant restaurant = restaurant(1L);
        User employeeTwo = user(2L, restaurant);
        User employeeOne = user(1L, restaurant);
        when(availabilityRepository.findByRestaurantId(1L)).thenReturn(List.of(
                availability(employeeTwo, DayOfWeek.FRIDAY, true),
                availability(employeeOne, DayOfWeek.WEDNESDAY, true),
                availability(employeeOne, DayOfWeek.MONDAY, true)
        ));

        List<AvailabilityResponse> responses = service.getRestaurantAvailability(1L);

        assertThat(responses).extracting(AvailabilityResponse::getEmployeeId)
                .containsExactly(1L, 1L, 2L);
        assertThat(responses).extracting(AvailabilityResponse::getDayOfWeek)
                .containsExactly(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
    }

    @Test
    void managerEmployeeReadRequiresRestaurantMembership() {
        User employee = user(5L, restaurant(2L));
        when(userRepository.findById(5L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.getEmployeeAvailabilityForManager(1L, 5L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee does not belong to this restaurant");
    }

    @Test
    void selfServiceRequiresUserToBelongToRestaurant() {
        User employee = user(5L, restaurant(2L));
        when(userRepository.findById(5L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.upsertMyAvailability(
                5L,
                1L,
                availabilityRequest(DayOfWeek.MONDAY, false, null, null)
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee does not belong to this restaurant");
    }

    private UpsertAvailabilityRequest availabilityRequest(
            DayOfWeek dayOfWeek,
            boolean available,
            LocalTime startTime,
            LocalTime endTime
    ) {
        UpsertAvailabilityRequest request = new UpsertAvailabilityRequest();
        request.setDayOfWeek(dayOfWeek);
        request.setAvailable(available);
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        return request;
    }

    private Availability availability(User employee, DayOfWeek dayOfWeek, boolean available) {
        Availability availability = new Availability();
        availability.setEmployee(employee);
        availability.setRestaurant(employee.getRestaurant());
        availability.setDayOfWeek(dayOfWeek);
        availability.setAvailable(available);
        availability.setStartTime(available ? LocalTime.of(9, 0) : null);
        availability.setEndTime(available ? LocalTime.of(17, 0) : null);
        return availability;
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }

    private User user(Long id, Restaurant restaurant) {
        User user = new User();
        user.setId(id);
        user.setName("Employee " + id);
        user.setEmail("employee" + id + "@example.com");
        user.setRole(Role.EMPLOYEE);
        user.setRestaurant(restaurant);
        return user;
    }
}
