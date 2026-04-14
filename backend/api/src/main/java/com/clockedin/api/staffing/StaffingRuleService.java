package com.clockedin.api.staffing;

import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffingRuleService {

    private final StaffingRuleRepository staffingRuleRepository;

    public StaffingRuleResponse upsertRule(Long restaurantId, UpsertStaffingRuleRequest request) {
        String normalizedRole = normalizeRole(request.getRole());

        StaffingRule staffingRule = staffingRuleRepository
                .findByRestaurantIdAndDayOfWeekAndRole(
                        restaurantId,
                        request.getDayOfWeek(),
                        normalizedRole
                )
                .orElseGet(() -> {
                    StaffingRule newRule = new StaffingRule();
                    newRule.setRestaurantId(restaurantId);
                    newRule.setDayOfWeek(request.getDayOfWeek());
                    newRule.setRole(normalizedRole);
                    return newRule;
                });

        staffingRule.setRequiredCount(request.getRequiredCount());
        staffingRule.setHeadsPerEmployee(request.getHeadsPerEmployee());

        StaffingRule saved = staffingRuleRepository.save(staffingRule);
        return toResponse(saved);
    }

    public List<StaffingRuleResponse> getAllRules(Long restaurantId) {
        return staffingRuleRepository.findByRestaurantIdOrderByDayOfWeekAscRoleAsc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<StaffingRuleResponse> getRulesForDay(Long restaurantId, DayOfWeek dayOfWeek) {
        return staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(restaurantId, dayOfWeek)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StaffingRuleResponse toResponse(StaffingRule staffingRule) {
        return new StaffingRuleResponse(
                staffingRule.getId(),
                staffingRule.getDayOfWeek(),
                staffingRule.getRole(),
                staffingRule.getRequiredCount(),
                staffingRule.getHeadsPerEmployee()
        );
    }

    private String normalizeRole(String role) {
        return role.trim().toUpperCase();
    }
}
