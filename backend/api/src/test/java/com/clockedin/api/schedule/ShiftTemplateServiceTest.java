package com.clockedin.api.schedule;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.schedule.dto.ShiftTemplateResponse;
import com.clockedin.api.schedule.dto.UpsertShiftTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShiftTemplateServiceTest {

    @Mock
    private ShiftTemplateRepository shiftTemplateRepository;

    @Mock
    private JobCodeRepository jobCodeRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private ShiftTemplateService shiftTemplateService;

    @Test
    void upsertCreatesTemplateForRestaurantJobCode() {
        Restaurant restaurant = restaurant(1L);
        JobCode server = jobCode(10L, restaurant, "SERVER", 1);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(server));
        when(shiftTemplateRepository.save(any(ShiftTemplate.class))).thenAnswer(invocation -> {
            ShiftTemplate template = invocation.getArgument(0);
            template.setId(20L);
            return template;
        });

        ShiftTemplateResponse response = shiftTemplateService.upsertTemplate(1L, request(null, 10L));

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.jobCodeName()).isEqualTo("SERVER");
        assertThat(response.name()).isEqualTo("Dinner Server");
        assertThat(response.maxEmployees()).isEqualTo(4);
    }

    @Test
    void upsertRejectsInvalidTimeRange() {
        UpsertShiftTemplateRequest request = request(null, 10L);
        request.setEndTime(LocalTime.of(15, 0));

        assertThatThrownBy(() -> shiftTemplateService.upsertTemplate(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startTime must be before endTime");
    }

    @Test
    void upsertRejectsJobCodeOutsideRestaurant() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L)));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shiftTemplateService.upsertTemplate(1L, request(null, 10L)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Job code not found");
    }

    private UpsertShiftTemplateRequest request(Long id, Long jobCodeId) {
        UpsertShiftTemplateRequest request = new UpsertShiftTemplateRequest();
        request.setId(id);
        request.setJobCodeId(jobCodeId);
        request.setDayOfWeek(DayOfWeek.MONDAY);
        request.setName(" Dinner Server ");
        request.setStartTime(LocalTime.of(16, 0));
        request.setEndTime(LocalTime.of(22, 0));
        request.setMinEmployees(1);
        request.setMaxEmployees(4);
        request.setActive(true);
        return request;
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }

    private JobCode jobCode(Long id, Restaurant restaurant, String name, int rank) {
        JobCode jobCode = new JobCode();
        jobCode.setId(id);
        jobCode.setRestaurant(restaurant);
        jobCode.setName(name);
        jobCode.setRank(rank);
        return jobCode;
    }
}
