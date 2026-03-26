package com.clockedin.api.availability;

import com.clockedin.api.availability.dto.AvailabilityResponse;
import com.clockedin.api.availability.dto.UpsertAvailabilityRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    public AvailabilityService(
            AvailabilityRepository availabilityRepository,
            UserRepository userRepository
    ) {
        this.availabilityRepository = availabilityRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AvailabilityResponse upsertMyAvailability(
            Long employeeId,
            Long restaurantId,
            UpsertAvailabilityRequest request
    ) {
        validateRequest(request);

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRestaurant() == null || !employee.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("Employee does not belong to this restaurant");
        }

        Availability availability = availabilityRepository
                .findByEmployeeIdAndDayOfWeek(employeeId, request.getDayOfWeek())
                .orElseGet(Availability::new);

        availability.setEmployee(employee);
        availability.setRestaurant(employee.getRestaurant());
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setAvailable(request.getAvailable());

        if (Boolean.TRUE.equals(request.getAvailable())) {
            availability.setStartTime(request.getStartTime());
            availability.setEndTime(request.getEndTime());
        } else {
            availability.setStartTime(null);
            availability.setEndTime(null);
        }

        Availability saved = availabilityRepository.save(availability);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getMyAvailability(Long employeeId) {
        return availabilityRepository.findByEmployeeId(employeeId).stream()
                .sorted(Comparator.comparingInt(a -> a.getDayOfWeek().getValue()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getRestaurantAvailability(Long restaurantId) {
        return availabilityRepository.findByRestaurantId(restaurantId).stream()
                .sorted(
                        Comparator.comparing((Availability a) -> a.getEmployee().getId())
                                .thenComparingInt(a -> a.getDayOfWeek().getValue())
                )
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getEmployeeAvailabilityForManager(Long restaurantId, Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRestaurant() == null || !employee.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("Employee does not belong to this restaurant");
        }

        return availabilityRepository.findByRestaurantIdAndEmployeeId(restaurantId, employeeId).stream()
                .sorted(Comparator.comparingInt(a -> a.getDayOfWeek().getValue()))
                .map(this::toResponse)
                .toList();
    }

    private void validateRequest(UpsertAvailabilityRequest request) {
        if (request.getDayOfWeek() == null) {
            throw new IllegalArgumentException("dayOfWeek is required");
        }

        if (request.getAvailable() == null) {
            throw new IllegalArgumentException("available is required");
        }

        if (Boolean.TRUE.equals(request.getAvailable())) {
            if (request.getStartTime() == null || request.getEndTime() == null) {
                throw new IllegalArgumentException("startTime and endTime are required when available is true");
            }

            if (!request.getStartTime().isBefore(request.getEndTime())) {
                throw new IllegalArgumentException("startTime must be before endTime");
            }
        }
    }

    private AvailabilityResponse toResponse(Availability availability) {
        User employee = availability.getEmployee();
        return new AvailabilityResponse(
                availability.getId(),
                employee.getId(),
                employee.getName(),
                availability.getDayOfWeek(),
                availability.isAvailable(),
                availability.getStartTime(),
                availability.getEndTime()
        );
    }
}
