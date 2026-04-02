package com.clockedin.api.rolepriority;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.rolepriority.dto.EmployeeRolePriorityResponse;
import com.clockedin.api.rolepriority.dto.UpsertEmployeeRolePriorityRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeRolePriorityService {

    private final EmployeeRolePriorityRepository employeeRolePriorityRepository;
    private final JobCodeRepository jobCodeRepository;
    private final UserRepository userRepository;

    public List<EmployeeRolePriorityResponse> getRestaurantPriorities(Long restaurantId) {
        return employeeRolePriorityRepository.findByRestaurantIdOrderByEmployeeIdAscJobCodeRankAsc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<EmployeeRolePriorityResponse> getEmployeePriorities(Long restaurantId, Long employeeId) {
        getEmployeeForRestaurant(employeeId, restaurantId);

        return employeeRolePriorityRepository.findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(restaurantId, employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EmployeeRolePriorityResponse upsertPriority(Long restaurantId, UpsertEmployeeRolePriorityRequest request) {
        User employee = getEmployeeForRestaurant(request.getEmployeeId(), restaurantId);
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getJobCodeId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        EmployeeRolePriority priority = employeeRolePriorityRepository
                .findByRestaurantIdAndEmployeeIdAndJobCodeId(
                        restaurantId,
                        employee.getId(),
                        jobCode.getId()
                )
                .orElseGet(EmployeeRolePriority::new);

        priority.setRestaurant(employee.getRestaurant());
        priority.setEmployee(employee);
        priority.setJobCode(jobCode);
        priority.setPriority(request.getPriority());

        return toResponse(employeeRolePriorityRepository.save(priority));
    }

    private User getEmployeeForRestaurant(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        return employee;
    }

    private EmployeeRolePriorityResponse toResponse(EmployeeRolePriority priority) {
        return new EmployeeRolePriorityResponse(
                priority.getId(),
                priority.getEmployee().getId(),
                priority.getEmployee().getName(),
                priority.getJobCode().getId(),
                priority.getJobCode().getName(),
                priority.getJobCode().getRank(),
                priority.getPriority()
        );
    }
}
