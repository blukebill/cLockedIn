package com.clockedin.api.availability;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.availability.dto.AvailabilityResponse;
import com.clockedin.api.availability.dto.UpsertAvailabilityRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<AvailabilityResponse> getMyAvailability(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return availabilityService.getMyAvailability(userDetails.getUserId());
    }

    @PutMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public AvailabilityResponse upsertMyAvailability(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertAvailabilityRequest request
    ) {
        return availabilityService.upsertMyAvailability(
                userDetails.getUserId(),
                userDetails.getRestaurantId(),
                request
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public List<AvailabilityResponse> getRestaurantAvailability(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return availabilityService.getRestaurantAvailability(userDetails.getRestaurantId());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('MANAGER')")
    public List<AvailabilityResponse> getEmployeeAvailability(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long employeeId
    ) {
        return availabilityService.getEmployeeAvailabilityForManager(
                userDetails.getRestaurantId(),
                employeeId
        );
    }
}
