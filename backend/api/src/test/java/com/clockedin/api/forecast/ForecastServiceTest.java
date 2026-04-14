package com.clockedin.api.forecast;

import com.clockedin.api.forecast.dto.ForecastResponse;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.staffing.StaffingRule;
import com.clockedin.api.staffing.StaffingRuleRepository;
import com.clockedin.api.forecast.dto.UpsertForecastRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForecastServiceTest {

    @Mock
    private ForecastRepository forecastRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private StaffingRuleRepository staffingRuleRepository;

    @InjectMocks
    private ForecastService forecastService;

    @Test
    void upsertCreatesForecastForRestaurantAndDate() {
        LocalDate date = LocalDate.of(2026, 4, 13);
        UpsertForecastRequest request = request("1200.00");
        when(forecastRepository.findByRestaurantIdAndForecastDate(1L, date)).thenReturn(Optional.empty());
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L, "20.00")));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(rule("COOK", 2, null), rule("SERVER", 2, 25)));
        when(forecastRepository.save(any(Forecast.class))).thenAnswer(invocation -> {
            Forecast forecast = invocation.getArgument(0);
            forecast.setId(10L);
            return forecast;
        });

        ForecastResponse response = forecastService.upsertForecast(1L, date, request);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDate()).isEqualTo(date);
        assertThat(response.getProjectedSales()).isEqualByComparingTo("1200.00");
        assertThat(response.getAveragePricePerHead()).isEqualByComparingTo("20.00");
        assertThat(response.getProjectedHeads()).isEqualTo(60);
        assertThat(response.getStaffingRequirements())
                .extracting("role", "baseRequiredCount", "headsPerEmployee", "requiredCount")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("COOK", 2, null, 2),
                        org.assertj.core.groups.Tuple.tuple("SERVER", 2, 25, 3)
                );
    }

    @Test
    void upsertUpdatesExistingForecastInsteadOfDuplicating() {
        LocalDate date = LocalDate.of(2026, 4, 13);
        Forecast existing = forecast(10L, 1L, date, "1000.00");
        when(forecastRepository.findByRestaurantIdAndForecastDate(1L, date)).thenReturn(Optional.of(existing));
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L, null)));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of());
        when(forecastRepository.save(existing)).thenReturn(existing);

        ForecastResponse response = forecastService.upsertForecast(1L, date, request("1500.00"));

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getProjectedSales()).isEqualByComparingTo("1500.00");
        assertThat(response.getProjectedHeads()).isNull();
        verify(forecastRepository).findByRestaurantIdAndForecastDate(1L, date);
    }

    @Test
    void weeklyFetchUsesRestaurantScopeAndReturnsRepositoryOrder() {
        LocalDate start = LocalDate.of(2026, 4, 13);
        Forecast monday = forecast(1L, 2L, start, "1000.00");
        Forecast tuesday = forecast(2L, 2L, start.plusDays(1), "1100.00");
        when(restaurantRepository.findById(2L)).thenReturn(Optional.of(restaurant(2L, "22.00")));
        when(forecastRepository.findByRestaurantIdAndForecastDateBetweenOrderByForecastDateAsc(
                2L,
                start,
                start.plusDays(6)
        )).thenReturn(List.of(monday, tuesday));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(2L, DayOfWeek.MONDAY))
                .thenReturn(List.of(rule("SERVER", 1, 20)));
        when(staffingRuleRepository.findByRestaurantIdAndDayOfWeekOrderByRoleAsc(2L, DayOfWeek.TUESDAY))
                .thenReturn(List.of(rule("SERVER", 1, 20)));

        List<ForecastResponse> responses = forecastService.getWeekForecast(2L, start);

        assertThat(responses).extracting(ForecastResponse::getDate).containsExactly(start, start.plusDays(1));
        assertThat(responses).extracting(ForecastResponse::getProjectedHeads).containsExactly(46, 50);
        assertThat(responses.get(0).getStaffingRequirements().get(0).getRequiredCount()).isEqualTo(3);
        verify(forecastRepository).findByRestaurantIdAndForecastDateBetweenOrderByForecastDateAsc(
                2L,
                start,
                start.plusDays(6)
        );
    }

    private UpsertForecastRequest request(String projectedSales) {
        UpsertForecastRequest request = new UpsertForecastRequest();
        request.setProjectedSales(new BigDecimal(projectedSales));
        return request;
    }

    private Restaurant restaurant(Long id, String averagePricePerHead) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        if (averagePricePerHead != null) {
            restaurant.setAveragePricePerHead(new BigDecimal(averagePricePerHead));
        }
        return restaurant;
    }

    private StaffingRule rule(String role, int requiredCount, Integer headsPerEmployee) {
        StaffingRule rule = new StaffingRule();
        rule.setRestaurantId(1L);
        rule.setRole(role);
        rule.setRequiredCount(requiredCount);
        rule.setHeadsPerEmployee(headsPerEmployee);
        return rule;
    }

    private Forecast forecast(Long id, Long restaurantId, LocalDate date, String projectedSales) {
        Forecast forecast = new Forecast();
        forecast.setId(id);
        forecast.setRestaurantId(restaurantId);
        forecast.setForecastDate(date);
        forecast.setProjectedSales(new BigDecimal(projectedSales));
        return forecast;
    }
}
