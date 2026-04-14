package com.clockedin.api.timeoff;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.timeoff.dto.CreateTimeOffRequest;
import com.clockedin.api.timeoff.dto.TimeOffRequestResponse;
import com.clockedin.api.timeoff.dto.UpdateTimeOffStatusRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeOffRequestServiceTest {

    @Mock
    private TimeOffRequestRepository timeOffRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private TimeOffRequestService service;

    @Test
    void createValidRequestDefaultsToPending() {
        Restaurant restaurant = restaurant(1L);
        User user = user(5L, restaurant);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(user));
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(timeOffRequestRepository.save(any(TimeOffRequest.class))).thenAnswer(invocation -> {
            TimeOffRequest request = invocation.getArgument(0);
            request.setId(99L);
            return request;
        });

        TimeOffRequestResponse response = service.createRequest(
                5L,
                1L,
                new CreateTimeOffRequest(LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), "Vacation")
        );

        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.userId()).isEqualTo(5L);
        assertThat(response.restaurantId()).isEqualTo(1L);
    }

    @Test
    void createRequestRejectsInvalidDateOrder() {
        assertThatThrownBy(() -> service.createRequest(
                5L,
                1L,
                new CreateTimeOffRequest(LocalDate.now().plusDays(2), LocalDate.now().plusDays(1), "Bad")
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date cannot be after end date");
    }

    @Test
    void getMyRequestsIsScopedToUser() {
        TimeOffRequest request = request(1L, user(5L, restaurant(1L)), TimeOffStatus.PENDING);
        when(timeOffRequestRepository.findByUserIdOrderByCreatedAtDesc(5L)).thenReturn(List.of(request));

        List<TimeOffRequestResponse> responses = service.getMyRequests(5L);

        assertThat(responses).extracting(TimeOffRequestResponse::userId).containsExactly(5L);
    }

    @Test
    void managerRestaurantWideViewIsScopedToRestaurant() {
        TimeOffRequest request = request(1L, user(5L, restaurant(2L)), TimeOffStatus.PENDING);
        when(timeOffRequestRepository.findByRestaurantIdOrderByCreatedAtDesc(2L)).thenReturn(List.of(request));

        List<TimeOffRequestResponse> responses = service.getRequestsForRestaurant(2L);

        assertThat(responses).extracting(TimeOffRequestResponse::restaurantId).containsExactly(2L);
    }

    @Test
    void managerCanApproveAndDenyRequests() {
        TimeOffRequest pending = request(1L, user(5L, restaurant(1L)), TimeOffStatus.PENDING);
        when(timeOffRequestRepository.findByIdAndRestaurantId(1L, 1L)).thenReturn(Optional.of(pending));
        when(timeOffRequestRepository.save(pending)).thenReturn(pending);

        TimeOffRequestResponse approved = service.updateStatus(1L, 1L, new UpdateTimeOffStatusRequest("APPROVED"));
        TimeOffRequestResponse denied = service.updateStatus(1L, 1L, new UpdateTimeOffStatusRequest("DENIED"));

        assertThat(approved.status()).isEqualTo("APPROVED");
        assertThat(denied.status()).isEqualTo("DENIED");
    }

    @Test
    void statusCannotBeSetBackToPending() {
        TimeOffRequest request = request(1L, user(5L, restaurant(1L)), TimeOffStatus.APPROVED);
        when(timeOffRequestRepository.findByIdAndRestaurantId(1L, 1L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.updateStatus(1L, 1L, new UpdateTimeOffStatusRequest("PENDING")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Status cannot be set to PENDING");
    }

    @Test
    void managerCannotUpdateRequestFromAnotherRestaurant() {
        when(timeOffRequestRepository.findByIdAndRestaurantId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(1L, 2L, new UpdateTimeOffStatusRequest("APPROVED")))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Time-off request not found");
    }

    private TimeOffRequest request(Long id, User user, TimeOffStatus status) {
        TimeOffRequest request = new TimeOffRequest();
        request.setId(id);
        request.setUser(user);
        request.setRestaurant(user.getRestaurant());
        request.setStartDate(LocalDate.now().plusDays(1));
        request.setEndDate(LocalDate.now().plusDays(2));
        request.setReason("Reason");
        request.setStatus(status);
        request.setCreatedAt(LocalDateTime.now());
        return request;
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }

    private User user(Long id, Restaurant restaurant) {
        User user = new User();
        user.setId(id);
        user.setName("Employee " + id);
        user.setEmail("employee" + id + "@example.com");
        user.setRole(Role.EMPLOYEE);
        user.setRestaurant(restaurant);
        return user;
    }
}
