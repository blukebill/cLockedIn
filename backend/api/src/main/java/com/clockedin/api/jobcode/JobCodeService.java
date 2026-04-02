package com.clockedin.api.jobcode;

import com.clockedin.api.jobcode.dto.AssignEmployeeJobCodeRequest;
import com.clockedin.api.jobcode.dto.EmployeeJobCodeResponse;
import com.clockedin.api.jobcode.dto.JobCodeResponse;
import com.clockedin.api.jobcode.dto.UpsertJobCodeRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobCodeService {

    private final JobCodeRepository jobCodeRepository;
    private final EmployeeJobCodeRepository employeeJobCodeRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public List<JobCodeResponse> getJobCodes(Long restaurantId) {
        return jobCodeRepository.findByRestaurantIdOrderByRankAsc(restaurantId)
                .stream()
                .map(this::toJobCodeResponse)
                .toList();
    }

    public JobCodeResponse upsertJobCode(Long restaurantId, UpsertJobCodeRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));

        String normalizedName = normalizeRoleName(request.getName());

        JobCode jobCode;
        if (request.getId() != null) {
            jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getId(), restaurantId)
                    .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

            if (jobCodeRepository.existsByRestaurantIdAndNameAndIdNot(restaurantId, normalizedName, jobCode.getId())) {
                throw new IllegalArgumentException("Job code name already in use");
            }

            if (jobCodeRepository.existsByRestaurantIdAndRankAndIdNot(restaurantId, request.getRank(), jobCode.getId())) {
                throw new IllegalArgumentException("Job code rank already in use");
            }
        } else {
            if (jobCodeRepository.existsByRestaurantIdAndName(restaurantId, normalizedName)) {
                throw new IllegalArgumentException("Job code name already in use");
            }

            if (jobCodeRepository.existsByRestaurantIdAndRank(restaurantId, request.getRank())) {
                throw new IllegalArgumentException("Job code rank already in use");
            }

            jobCode = new JobCode();
            jobCode.setRestaurant(restaurant);
        }

        jobCode.setName(normalizedName);
        jobCode.setRank(request.getRank());

        return toJobCodeResponse(jobCodeRepository.save(jobCode));
    }

    public List<EmployeeJobCodeResponse> getEmployeeJobCodes(Long restaurantId) {
        return employeeJobCodeRepository.findByRestaurantIdOrderByEmployeeIdAsc(restaurantId)
                .stream()
                .map(this::toEmployeeJobCodeResponse)
                .toList();
    }

    public EmployeeJobCodeResponse getEmployeeJobCode(Long restaurantId, Long employeeId) {
        EmployeeJobCode assignment = employeeJobCodeRepository.findByRestaurantIdAndEmployeeId(restaurantId, employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee job code assignment not found"));

        return toEmployeeJobCodeResponse(assignment);
    }

    public EmployeeJobCodeResponse assignEmployeeJobCode(
            Long restaurantId,
            Long employeeId,
            AssignEmployeeJobCodeRequest request
    ) {
        User employee = getEmployeeForRestaurant(employeeId, restaurantId);
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getJobCodeId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        EmployeeJobCode assignment = employeeJobCodeRepository.findByRestaurantIdAndEmployeeId(restaurantId, employeeId)
                .orElseGet(EmployeeJobCode::new);

        assignment.setRestaurant(employee.getRestaurant());
        assignment.setEmployee(employee);
        assignment.setJobCode(jobCode);

        return toEmployeeJobCodeResponse(employeeJobCodeRepository.save(assignment));
    }

    private User getEmployeeForRestaurant(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        return employee;
    }

    private JobCodeResponse toJobCodeResponse(JobCode jobCode) {
        return new JobCodeResponse(
                jobCode.getId(),
                jobCode.getName(),
                jobCode.getRank()
        );
    }

    private EmployeeJobCodeResponse toEmployeeJobCodeResponse(EmployeeJobCode assignment) {
        return new EmployeeJobCodeResponse(
                assignment.getId(),
                assignment.getEmployee().getId(),
                assignment.getEmployee().getName(),
                assignment.getJobCode().getId(),
                assignment.getJobCode().getName(),
                assignment.getJobCode().getRank()
        );
    }

    private String normalizeRoleName(String value) {
        return value.trim().toUpperCase();
    }
}
