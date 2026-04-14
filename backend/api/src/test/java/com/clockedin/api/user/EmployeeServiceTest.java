package com.clockedin.api.user;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.dto.CreateEmployeeRequest;
import com.clockedin.api.user.dto.EmployeeResponse;
import com.clockedin.api.user.dto.UpdateEmployeeRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void createEmployeeSavesEmployeeForManagersRestaurant() {
        Restaurant restaurant = restaurant(1L);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(20L);
            return user;
        });

        EmployeeResponse response = employeeService.createEmployee(
                new CreateEmployeeRequest("New Employee", "new@example.com", "password123"),
                1L
        );

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.name()).isEqualTo("New Employee");
        assertThat(response.role()).isEqualTo("EMPLOYEE");
        assertThat(response.restaurantId()).isEqualTo(1L);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(Role.EMPLOYEE);
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("encoded-password");
        assertThat(captor.getValue().getRestaurant()).isSameAs(restaurant);
    }

    @Test
    void createEmployeeRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.createEmployee(
                new CreateEmployeeRequest("Taken", "taken@example.com", "password123"),
                1L
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already in use");

        verify(userRepository, never()).save(any());
    }

    @Test
    void listingEmployeesUsesRestaurantAndEmployeeRoleScope() {
        User employee = user(10L, "employee@example.com", Role.EMPLOYEE, restaurant(1L));
        when(userRepository.findByRestaurantIdAndRole(1L, Role.EMPLOYEE)).thenReturn(List.of(employee));

        List<EmployeeResponse> responses = employeeService.getEmployeesForRestaurant(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().email()).isEqualTo("employee@example.com");
        verify(userRepository).findByRestaurantIdAndRole(1L, Role.EMPLOYEE);
    }

    @Test
    void updateEmployeeUpdatesNameEmailAndEncodedPassword() {
        User employee = user(10L, "old@example.com", Role.EMPLOYEE, restaurant(1L));
        employee.setName("Old Name");
        employee.setPasswordHash("old-hash");
        when(userRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(employee));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");
        when(userRepository.save(employee)).thenReturn(employee);

        EmployeeResponse response = employeeService.updateEmployee(
                10L,
                new UpdateEmployeeRequest("New Name", "new@example.com", "newPassword123"),
                1L
        );

        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.email()).isEqualTo("new@example.com");
        assertThat(employee.getPasswordHash()).isEqualTo("new-hash");
    }

    @Test
    void updateEmployeeRejectsNonEmployeeUser() {
        User manager = user(11L, "manager@example.com", Role.MANAGER, restaurant(1L));
        when(userRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(manager));

        assertThatThrownBy(() -> employeeService.updateEmployee(
                11L,
                new UpdateEmployeeRequest("Name", null, null),
                1L
        )).isInstanceOf(EntityNotFoundException.class);
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }

    private User user(Long id, String email, Role role, Restaurant restaurant) {
        User user = new User();
        user.setId(id);
        user.setName("User " + id);
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setEnabled(true);
        user.setRestaurant(restaurant);
        return user;
    }
}
