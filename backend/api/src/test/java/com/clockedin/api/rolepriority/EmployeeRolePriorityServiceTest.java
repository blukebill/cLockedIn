package com.clockedin.api.rolepriority;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.rolepriority.dto.EmployeeRolePriorityResponse;
import com.clockedin.api.rolepriority.dto.UpsertEmployeeRolePriorityRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeRolePriorityServiceTest {

    @Mock
    private EmployeeRolePriorityRepository employeeRolePriorityRepository;

    @Mock
    private JobCodeRepository jobCodeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeeRolePriorityService service;

    @Test
    void upsertPrioritySucceedsForValidEmployeeAndJobCodeInSameRestaurant() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(1L, 5L, 10L))
                .thenReturn(Optional.empty());
        when(employeeRolePriorityRepository.save(any(EmployeeRolePriority.class))).thenAnswer(invocation -> {
            EmployeeRolePriority priority = invocation.getArgument(0);
            priority.setId(20L);
            return priority;
        });

        EmployeeRolePriorityResponse response = service.upsertPriority(1L, request(5L, 10L, 3));

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.priority()).isEqualTo(3);
    }

    @Test
    void updatingExistingPriorityOverwritesValue() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        EmployeeRolePriority existing = priority(20L, employee, jobCode, 1);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(1L, 5L, 10L))
                .thenReturn(Optional.of(existing));
        when(employeeRolePriorityRepository.save(existing)).thenReturn(existing);

        EmployeeRolePriorityResponse response = service.upsertPriority(1L, request(5L, 10L, 5));

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.priority()).isEqualTo(5);
    }

    @Test
    void updatingPriorityByIdCanChangeEmployeeAndJobCode() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        User nextEmployee = user(6L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        EmployeeRolePriority existing = priority(20L, employee, jobCode, 1);
        UpsertEmployeeRolePriorityRequest request = request(6L, 10L, 2);
        request.setId(20L);
        when(userRepository.findByIdAndRestaurantId(6L, 1L)).thenReturn(Optional.of(nextEmployee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(employeeRolePriorityRepository.findByIdAndRestaurantId(20L, 1L)).thenReturn(Optional.of(existing));
        when(employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(1L, 6L, 10L))
                .thenReturn(Optional.empty());
        when(employeeRolePriorityRepository.save(existing)).thenReturn(existing);

        EmployeeRolePriorityResponse response = service.upsertPriority(1L, request);

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.employeeId()).isEqualTo(6L);
        assertThat(response.priority()).isEqualTo(2);
    }

    @Test
    void updatingPriorityByIdRejectsDuplicateEmployeeAndJobCode() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        EmployeeRolePriority existing = priority(20L, employee, jobCode, 1);
        EmployeeRolePriority duplicate = priority(21L, employee, jobCode, 4);
        UpsertEmployeeRolePriorityRequest request = request(5L, 10L, 2);
        request.setId(20L);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(employeeRolePriorityRepository.findByIdAndRestaurantId(20L, 1L)).thenReturn(Optional.of(existing));
        when(employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(1L, 5L, 10L))
                .thenReturn(Optional.of(duplicate));

        assertThatThrownBy(() -> service.upsertPriority(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void crossRestaurantEmployeeIsRejected() {
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upsertPriority(1L, request(5L, 10L, 3)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Employee not found");
    }

    @Test
    void crossRestaurantJobCodeIsRejected() {
        User employee = user(5L, restaurant(1L));
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upsertPriority(1L, request(5L, 10L, 3)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Job code not found");
    }

    @Test
    void restaurantWideAndPerEmployeeListingsAreScoped() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        EmployeeRolePriority priority = priority(20L, employee, jobCode, 3);
        when(employeeRolePriorityRepository.findByRestaurantIdOrderByEmployeeIdAscJobCodeRankAsc(1L))
                .thenReturn(List.of(priority));
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(1L, 5L))
                .thenReturn(List.of(priority));

        assertThat(service.getRestaurantPriorities(1L)).hasSize(1);
        assertThat(service.getEmployeePriorities(1L, 5L)).hasSize(1);

        verify(employeeRolePriorityRepository).findByRestaurantIdOrderByEmployeeIdAscJobCodeRankAsc(1L);
        verify(employeeRolePriorityRepository).findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(1L, 5L);
    }

    @Test
    void deletePriorityUsesRestaurantScope() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant);
        JobCode jobCode = jobCode(10L, restaurant);
        EmployeeRolePriority existing = priority(20L, employee, jobCode, 3);
        when(employeeRolePriorityRepository.findByIdAndRestaurantId(20L, 1L)).thenReturn(Optional.of(existing));

        service.deletePriority(1L, 20L);

        verify(employeeRolePriorityRepository).delete(existing);
    }

    @Test
    void deletePriorityRejectsMissingRestaurantScopedPriority() {
        when(employeeRolePriorityRepository.findByIdAndRestaurantId(20L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deletePriority(1L, 20L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Role priority not found");
    }

    private UpsertEmployeeRolePriorityRequest request(Long employeeId, Long jobCodeId, int priority) {
        UpsertEmployeeRolePriorityRequest request = new UpsertEmployeeRolePriorityRequest();
        request.setEmployeeId(employeeId);
        request.setJobCodeId(jobCodeId);
        request.setPriority(priority);
        return request;
    }

    private EmployeeRolePriority priority(Long id, User employee, JobCode jobCode, int value) {
        EmployeeRolePriority priority = new EmployeeRolePriority();
        priority.setId(id);
        priority.setRestaurant(employee.getRestaurant());
        priority.setEmployee(employee);
        priority.setJobCode(jobCode);
        priority.setPriority(value);
        return priority;
    }

    private JobCode jobCode(Long id, Restaurant restaurant) {
        JobCode jobCode = new JobCode();
        jobCode.setId(id);
        jobCode.setRestaurant(restaurant);
        jobCode.setName("COOK");
        jobCode.setRank(1);
        return jobCode;
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
