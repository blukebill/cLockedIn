package com.clockedin.api.staffing;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/staffing-rules")
@RequiredArgsConstructor
public class StaffingRuleController {

    private final StaffingRuleService staffingRuleService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public List<StaffingRuleResponse> getAllRules(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long restaurantId = userDetails.getRestaurantId();

        return staffingRuleService.getAllRules(restaurantId);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/{dayOfWeek}")
    public List<StaffingRuleResponse> getRulesForDay(
            @PathVariable DayOfWeek dayOfWeek,
            Authentication authentication
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long restaurantId = userDetails.getRestaurantId();

        return staffingRuleService.getRulesForDay(restaurantId, dayOfWeek);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping
    public StaffingRuleResponse upsertRule(
            @Valid @RequestBody UpsertStaffingRuleRequest request,
            Authentication authentication
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long restaurantId = userDetails.getRestaurantId();

        return staffingRuleService.upsertRule(restaurantId, request);
    }
}
