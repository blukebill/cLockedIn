package com.clockedin.api.rolepriority;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.rolepriority.dto.EmployeeRolePriorityResponse;
import com.clockedin.api.rolepriority.dto.UpsertEmployeeRolePriorityRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee-role-priorities")
@RequiredArgsConstructor
public class EmployeeRolePriorityController {

    private final EmployeeRolePriorityService employeeRolePriorityService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public List<EmployeeRolePriorityResponse> getRestaurantPriorities(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return employeeRolePriorityService.getRestaurantPriorities(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/employee/{employeeId}")
    public List<EmployeeRolePriorityResponse> getEmployeePriorities(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long employeeId
    ) {
        return employeeRolePriorityService.getEmployeePriorities(userDetails.getRestaurantId(), employeeId);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping
    public EmployeeRolePriorityResponse upsertPriority(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertEmployeeRolePriorityRequest request
    ) {
        return employeeRolePriorityService.upsertPriority(userDetails.getRestaurantId(), request);
    }
}
