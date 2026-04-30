package com.clockedin.api.timeoff;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.timeoff.dto.CreateTimeOffRequest;
import com.clockedin.api.timeoff.dto.TimeOffRequestResponse;
import com.clockedin.api.timeoff.dto.UpdateTimeOffStatusRequest;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeOffRequestService {

    private final TimeOffRequestRepository timeOffRequestRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public TimeOffRequestResponse createRequest(
            Long userId,
            Long restaurantId,
            CreateTimeOffRequest request
    ) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        if (!request.startTime().isBefore(request.endTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        User user = userRepository.findByIdAndRestaurantId(userId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));

        TimeOffRequest timeOffRequest = new TimeOffRequest();
        timeOffRequest.setUser(user);
        timeOffRequest.setRestaurant(restaurant);
        timeOffRequest.setStartDate(request.startDate());
        timeOffRequest.setEndDate(request.endDate());
        timeOffRequest.setStartTime(request.startTime());
        timeOffRequest.setEndTime(request.endTime());
        timeOffRequest.setReason(request.reason());
        timeOffRequest.setStatus(TimeOffStatus.PENDING);
        timeOffRequest.setCreatedAt(LocalDateTime.now());

        TimeOffRequest saved = timeOffRequestRepository.save(timeOffRequest);
        return toResponse(saved);
    }

    public List<TimeOffRequestResponse> getMyRequests(Long userId) {
        return timeOffRequestRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TimeOffRequestResponse> getRequestsForRestaurant(Long restaurantId) {
        return timeOffRequestRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TimeOffRequestResponse updateStatus(
            Long requestId,
            Long restaurantId,
            UpdateTimeOffStatusRequest request
    ) {
        TimeOffRequest timeOffRequest = timeOffRequestRepository.findByIdAndRestaurantId(requestId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Time-off request not found"));

        TimeOffStatus status;
        try {
            status = TimeOffStatus.valueOf(request.status().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status. Must be APPROVED or DENIED");
        }

        if (status == TimeOffStatus.PENDING) {
            throw new IllegalArgumentException("Status cannot be set to PENDING");
        }

        timeOffRequest.setStatus(status);
        TimeOffRequest saved = timeOffRequestRepository.save(timeOffRequest);
        return toResponse(saved);
    }

    private TimeOffRequestResponse toResponse(TimeOffRequest request) {
        return new TimeOffRequestResponse(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getName(),
                request.getUser().getEmail(),
                request.getRestaurant().getId(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getReason(),
                request.getStatus().name(),
                request.getCreatedAt()
        );
    }
}
