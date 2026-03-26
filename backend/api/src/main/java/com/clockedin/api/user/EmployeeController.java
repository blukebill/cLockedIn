package com.clockedin.api.user;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.user.dto.CreateEmployeeRequest;
import com.clockedin.api.user.dto.EmployeeResponse;
import com.clockedin.api.user.dto.UpdateEmployeeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public List<EmployeeResponse> getEmployees(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return employeeService.getEmployeesForRestaurant(userDetails.getRestaurantId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public EmployeeResponse getEmployee(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return employeeService.getEmployeeById(id, userDetails.getRestaurantId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MANAGER')")
    public EmployeeResponse createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return employeeService.createEmployee(request, userDetails.getRestaurantId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public EmployeeResponse updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return employeeService.updateEmployee(id, request, userDetails.getRestaurantId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('MANAGER')")
    public void deleteEmployee(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        employeeService.deleteEmployee(id, userDetails.getRestaurantId());
    }
}
