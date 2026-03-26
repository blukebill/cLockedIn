package com.clockedin.api.user;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.dto.CreateEmployeeRequest;
import com.clockedin.api.user.dto.EmployeeResponse;
import com.clockedin.api.user.dto.UpdateEmployeeRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;

    public List<EmployeeResponse> getEmployeesForRestaurant(Long restaurantId) {
        return userRepository.findByRestaurantIdAndRole(restaurantId, Role.EMPLOYEE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EmployeeResponse getEmployeeById(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        return toResponse(employee);
    }

    public EmployeeResponse createEmployee(CreateEmployeeRequest request, Long restaurantId) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
	
        User user = new User();
        user.setName(request.name());
	user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.EMPLOYEE);
        user.setEnabled(true);
	user.setRestaurant(restaurant);

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public EmployeeResponse updateEmployee(Long employeeId, UpdateEmployeeRequest request, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        if (request.email() != null && !request.email().isBlank()) {
            if (!employee.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email already in use");
            }
            employee.setEmail(request.email());
        }

        if (request.password() != null && !request.password().isBlank()) {
            employee.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        User saved = userRepository.save(employee);
        return toResponse(saved);
    }

    public void deleteEmployee(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        userRepository.delete(employee);
    }

    private EmployeeResponse toResponse(User user) {
        return new EmployeeResponse(
                user.getId(),
		user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getRestaurant().getId(),
        	user.isEnabled()
	);
    }
}
