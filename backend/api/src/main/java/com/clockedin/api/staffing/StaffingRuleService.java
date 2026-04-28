package com.clockedin.api.staffing;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffingRuleService {

    private final StaffingRuleRepository staffingRuleRepository;
    private final JobCodeRepository jobCodeRepository;

    public StaffingRuleResponse upsertRule(Long restaurantId, UpsertStaffingRuleRequest request) {
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getJobCodeId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        StaffingRule staffingRule = findTargetRule(restaurantId, request, jobCode);

        staffingRule.setDayOfWeek(request.getDayOfWeek());
        staffingRule.setJobCode(jobCode);
        staffingRule.setRequiredCount(request.getRequiredCount() == null ? 0 : request.getRequiredCount());
        staffingRule.setHeadsPerEmployee(request.getHeadsPerEmployee());

        StaffingRule saved = staffingRuleRepository.save(staffingRule);
        return toResponse(saved);
    }

    private StaffingRule findTargetRule(Long restaurantId, UpsertStaffingRuleRequest request, JobCode jobCode) {
        if (request.getId() != null) {
            StaffingRule existingRule = staffingRuleRepository.findByIdAndRestaurantId(request.getId(), restaurantId)
                    .orElseThrow(() -> new EntityNotFoundException("Staffing rule not found"));
            assertNoDuplicateRule(restaurantId, request, jobCode, existingRule.getId());
            return existingRule;
        }

        return staffingRuleRepository
                .findByRestaurantIdAndDayOfWeekAndJobCodeId(
                        restaurantId,
                        request.getDayOfWeek(),
                        jobCode.getId()
                )
                .orElseGet(() -> {
                    StaffingRule newRule = new StaffingRule();
                    newRule.setRestaurantId(restaurantId);
                    return newRule;
                });
    }

    private void assertNoDuplicateRule(
            Long restaurantId,
            UpsertStaffingRuleRequest request,
            JobCode jobCode,
            Long currentRuleId
    ) {
        staffingRuleRepository
                .findByRestaurantIdAndDayOfWeekAndJobCodeId(restaurantId, request.getDayOfWeek(), jobCode.getId())
                .filter(rule -> !rule.getId().equals(currentRuleId))
                .ifPresent(rule -> {
                    throw new IllegalArgumentException("Staffing rule already exists for this day and job code");
                });
    }

    public List<StaffingRuleResponse> getAllRules(Long restaurantId) {
        return staffingRuleRepository.findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAsc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<StaffingRuleResponse> getRulesForDay(Long restaurantId, DayOfWeek dayOfWeek) {
        return staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAsc(restaurantId, dayOfWeek)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteRule(Long restaurantId, Long ruleId) {
        StaffingRule staffingRule = staffingRuleRepository.findByIdAndRestaurantId(ruleId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Staffing rule not found"));

        staffingRuleRepository.delete(staffingRule);
    }

    private StaffingRuleResponse toResponse(StaffingRule staffingRule) {
        return new StaffingRuleResponse(
                staffingRule.getId(),
                staffingRule.getDayOfWeek(),
                staffingRule.getJobCode().getId(),
                staffingRule.getJobCode().getName(),
                staffingRule.getJobCode().getRank(),
                staffingRule.getRequiredCount(),
                staffingRule.getHeadsPerEmployee()
        );
    }
}
