package com.clockedin.api.timeoff;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.timeoff.dto.CreateTimeOffRequest;
import com.clockedin.api.timeoff.dto.TimeOffRequestResponse;
import com.clockedin.api.timeoff.dto.UpdateTimeOffStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/time-off-requests")
@RequiredArgsConstructor
public class TimeOffRequestController {

    private final TimeOffRequestService timeOffRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public TimeOffRequestResponse createRequest(
            @Valid @RequestBody CreateTimeOffRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return timeOffRequestService.createRequest(
                userDetails.getUserId(),
                userDetails.getRestaurantId(),
                request
        );
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public List<TimeOffRequestResponse> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return timeOffRequestService.getMyRequests(userDetails.getUserId());
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public List<TimeOffRequestResponse> getRestaurantRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return timeOffRequestService.getRequestsForRestaurant(userDetails.getRestaurantId());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public TimeOffRequestResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTimeOffStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return timeOffRequestService.updateStatus(
                id,
                userDetails.getRestaurantId(),
                request
        );
    }
}
