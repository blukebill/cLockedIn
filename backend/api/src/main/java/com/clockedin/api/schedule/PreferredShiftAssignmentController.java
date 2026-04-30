package com.clockedin.api.schedule;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.schedule.dto.PreferredShiftAssignmentResponse;
import com.clockedin.api.schedule.dto.UpsertPreferredShiftAssignmentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/preferred-shift-assignments")
@RequiredArgsConstructor
public class PreferredShiftAssignmentController {

    private final PreferredShiftAssignmentService preferredShiftAssignmentService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public List<PreferredShiftAssignmentResponse> getAssignments(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return preferredShiftAssignmentService.getAssignments(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping
    public PreferredShiftAssignmentResponse upsertAssignment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertPreferredShiftAssignmentRequest request
    ) {
        return preferredShiftAssignmentService.upsertAssignment(userDetails.getRestaurantId(), request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/{assignmentId}")
    public void deleteAssignment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long assignmentId
    ) {
        preferredShiftAssignmentService.deleteAssignment(userDetails.getRestaurantId(), assignmentId);
    }
}
