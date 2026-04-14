package com.clockedin.api.staffing;

import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffingRuleServiceTest {

    @Mock
    private StaffingRuleRepository staffingRuleRepository;

    @InjectMocks
    private StaffingRuleService staffingRuleService;

    @Test
    void upsertNormalizesRoleNamesToUppercase() {
        UpsertStaffingRuleRequest request = request(DayOfWeek.MONDAY, " cook ", 2);
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndRole(1L, DayOfWeek.MONDAY, "COOK"))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> {
            StaffingRule rule = invocation.getArgument(0);
            rule.setId(5L);
            return rule;
        });

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request);

        assertThat(response.getRole()).isEqualTo("COOK");
        assertThat(response.getRequiredCount()).isEqualTo(2);
    }

    @Test
    void upsertStoresHeadsPerEmployeeRequirement() {
        UpsertStaffingRuleRequest request = request(DayOfWeek.MONDAY, "server", 2, 25);
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndRole(1L, DayOfWeek.MONDAY, "SERVER"))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request);

        assertThat(response.getHeadsPerEmployee()).isEqualTo(25);
    }

    @Test
    void upsertUpdatesExistingRestaurantDayRole() {
        StaffingRule existing = rule(7L, 1L, DayOfWeek.TUESDAY, "SERVER", 2);
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndRole(1L, DayOfWeek.TUESDAY, "SERVER"))
                .thenReturn(Optional.of(existing));
        when(staffingRuleRepository.save(existing)).thenReturn(existing);

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request(DayOfWeek.TUESDAY, "server", 4));

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getRequiredCount()).isEqualTo(4);
    }

    @Test
    void sameDayRoleInDifferentRestaurantsIsIndependent() {
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        staffingRuleService.upsertRule(1L, request(DayOfWeek.MONDAY, "cook", 2));
        staffingRuleService.upsertRule(2L, request(DayOfWeek.MONDAY, "cook", 3));

        verify(staffingRuleRepository).findByRestaurantIdAndDayOfWeekAndRole(1L, DayOfWeek.MONDAY, "COOK");
        verify(staffingRuleRepository).findByRestaurantIdAndDayOfWeekAndRole(2L, DayOfWeek.MONDAY, "COOK");
    }

    @Test
    void listMethodsUseRestaurantScope() {
        when(staffingRuleRepository.findByRestaurantIdOrderByDayOfWeekAscRoleAsc(1L))
                .thenReturn(List.of(rule(1L, 1L, DayOfWeek.MONDAY, "COOK", 2)));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(rule(1L, 1L, DayOfWeek.MONDAY, "COOK", 2)));

        assertThat(staffingRuleService.getAllRules(1L)).hasSize(1);
        assertThat(staffingRuleService.getRulesForDay(1L, DayOfWeek.MONDAY)).hasSize(1);

        verify(staffingRuleRepository).findByRestaurantIdOrderByDayOfWeekAscRoleAsc(1L);
        verify(staffingRuleRepository).findByRestaurantIdAndDayOfWeekOrderByRoleAsc(1L, DayOfWeek.MONDAY);
    }

    private UpsertStaffingRuleRequest request(DayOfWeek dayOfWeek, String role, int requiredCount) {
        return request(dayOfWeek, role, requiredCount, null);
    }

    private UpsertStaffingRuleRequest request(
            DayOfWeek dayOfWeek,
            String role,
            int requiredCount,
            Integer headsPerEmployee
    ) {
        UpsertStaffingRuleRequest request = new UpsertStaffingRuleRequest();
        request.setDayOfWeek(dayOfWeek);
        request.setRole(role);
        request.setRequiredCount(requiredCount);
        request.setHeadsPerEmployee(headsPerEmployee);
        return request;
    }

    private StaffingRule rule(Long id, Long restaurantId, DayOfWeek dayOfWeek, String role, int requiredCount) {
        StaffingRule rule = new StaffingRule();
        rule.setId(id);
        rule.setRestaurantId(restaurantId);
        rule.setDayOfWeek(dayOfWeek);
        rule.setRole(role);
        rule.setRequiredCount(requiredCount);
        return rule;
    }
}
