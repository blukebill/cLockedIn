package com.clockedin.api.staffing;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffingRuleServiceTest {

    @Mock
    private StaffingRuleRepository staffingRuleRepository;

    @Mock
    private JobCodeRepository jobCodeRepository;

    @InjectMocks
    private StaffingRuleService staffingRuleService;

    @Test
    void upsertStoresJobCodeScopedRule() {
        JobCode cook = jobCode(10L, "COOK", 1);
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(cook));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.MONDAY, 10L))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> {
            StaffingRule rule = invocation.getArgument(0);
            rule.setId(5L);
            return rule;
        });

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request(DayOfWeek.MONDAY, 10L, 2));

        assertThat(response.getJobCodeId()).isEqualTo(10L);
        assertThat(response.getJobCodeName()).isEqualTo("COOK");
        assertThat(response.getRequiredCount()).isEqualTo(2);
    }

    @Test
    void upsertDefaultsRequiredCountWhenOmitted() {
        JobCode server = jobCode(11L, "SERVER", 2);
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.MONDAY, 11L))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request(DayOfWeek.MONDAY, 11L, null, 25));

        assertThat(response.getRequiredCount()).isZero();
        assertThat(response.getHeadsPerEmployee()).isEqualTo(25);
    }

    @Test
    void upsertStoresHeadsPerEmployeeRequirement() {
        JobCode server = jobCode(11L, "SERVER", 2);
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.MONDAY, 11L))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(any(StaffingRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request(DayOfWeek.MONDAY, 11L, 2, 25));

        assertThat(response.getHeadsPerEmployee()).isEqualTo(25);
    }

    @Test
    void upsertRejectsJobCodeOutsideRestaurant() {
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> staffingRuleService.upsertRule(1L, request(DayOfWeek.MONDAY, 11L, 2)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Job code not found");
    }

    @Test
    void upsertUpdatesExistingRestaurantDayJobCode() {
        JobCode server = jobCode(11L, "SERVER", 2);
        StaffingRule existing = rule(7L, 1L, DayOfWeek.TUESDAY, server, 2);
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.TUESDAY, 11L))
                .thenReturn(Optional.of(existing));
        when(staffingRuleRepository.save(existing)).thenReturn(existing);

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request(DayOfWeek.TUESDAY, 11L, 4));

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getRequiredCount()).isEqualTo(4);
    }

    @Test
    void upsertUpdatesRuleById() {
        JobCode server = jobCode(11L, "SERVER", 2);
        StaffingRule existing = rule(7L, 1L, DayOfWeek.TUESDAY, server, 2);
        UpsertStaffingRuleRequest request = request(DayOfWeek.FRIDAY, 11L, null, 18);
        request.setId(7L);
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(staffingRuleRepository.findByIdAndRestaurantId(7L, 1L)).thenReturn(Optional.of(existing));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.FRIDAY, 11L))
                .thenReturn(Optional.empty());
        when(staffingRuleRepository.save(existing)).thenReturn(existing);

        StaffingRuleResponse response = staffingRuleService.upsertRule(1L, request);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getDayOfWeek()).isEqualTo(DayOfWeek.FRIDAY);
        assertThat(response.getRequiredCount()).isZero();
        assertThat(response.getHeadsPerEmployee()).isEqualTo(18);
    }

    @Test
    void upsertByIdRejectsDuplicateDayAndJobCode() {
        JobCode server = jobCode(11L, "SERVER", 2);
        StaffingRule existing = rule(7L, 1L, DayOfWeek.TUESDAY, server, 2);
        StaffingRule duplicate = rule(8L, 1L, DayOfWeek.FRIDAY, server, 0);
        UpsertStaffingRuleRequest request = request(DayOfWeek.FRIDAY, 11L, null, 18);
        request.setId(7L);
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(staffingRuleRepository.findByIdAndRestaurantId(7L, 1L)).thenReturn(Optional.of(existing));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekAndJobCodeId(1L, DayOfWeek.FRIDAY, 11L))
                .thenReturn(Optional.of(duplicate));

        assertThatThrownBy(() -> staffingRuleService.upsertRule(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void deleteRuleUsesRestaurantScope() {
        JobCode server = jobCode(11L, "SERVER", 2);
        StaffingRule existing = rule(7L, 1L, DayOfWeek.TUESDAY, server, 2);
        when(staffingRuleRepository.findByIdAndRestaurantId(7L, 1L)).thenReturn(Optional.of(existing));

        staffingRuleService.deleteRule(1L, 7L);

        verify(staffingRuleRepository).delete(existing);
    }

    @Test
    void deleteRuleRejectsMissingRestaurantScopedRule() {
        when(staffingRuleRepository.findByIdAndRestaurantId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> staffingRuleService.deleteRule(1L, 7L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Staffing rule not found");
    }

    @Test
    void listMethodsUseRestaurantScope() {
        JobCode cook = jobCode(10L, "COOK", 1);
        when(staffingRuleRepository.findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAsc(1L))
                .thenReturn(List.of(rule(1L, 1L, DayOfWeek.MONDAY, cook, 2)));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAsc(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(rule(1L, 1L, DayOfWeek.MONDAY, cook, 2)));

        assertThat(staffingRuleService.getAllRules(1L)).hasSize(1);
        assertThat(staffingRuleService.getRulesForDay(1L, DayOfWeek.MONDAY)).hasSize(1);

        verify(staffingRuleRepository).findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAsc(1L);
        verify(staffingRuleRepository).findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAsc(1L, DayOfWeek.MONDAY);
    }

    private UpsertStaffingRuleRequest request(DayOfWeek dayOfWeek, Long jobCodeId, Integer requiredCount) {
        return request(dayOfWeek, jobCodeId, requiredCount, null);
    }

    private UpsertStaffingRuleRequest request(
            DayOfWeek dayOfWeek,
            Long jobCodeId,
            Integer requiredCount,
            Integer headsPerEmployee
    ) {
        UpsertStaffingRuleRequest request = new UpsertStaffingRuleRequest();
        request.setDayOfWeek(dayOfWeek);
        request.setJobCodeId(jobCodeId);
        request.setRequiredCount(requiredCount);
        request.setHeadsPerEmployee(headsPerEmployee);
        return request;
    }

    private StaffingRule rule(Long id, Long restaurantId, DayOfWeek dayOfWeek, JobCode jobCode, int requiredCount) {
        StaffingRule rule = new StaffingRule();
        rule.setId(id);
        rule.setRestaurantId(restaurantId);
        rule.setDayOfWeek(dayOfWeek);
        rule.setJobCode(jobCode);
        rule.setRequiredCount(requiredCount);
        return rule;
    }

    private JobCode jobCode(Long id, String name, int rank) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);
        JobCode jobCode = new JobCode();
        jobCode.setId(id);
        jobCode.setRestaurant(restaurant);
        jobCode.setName(name);
        jobCode.setRank(rank);
        return jobCode;
    }
}
