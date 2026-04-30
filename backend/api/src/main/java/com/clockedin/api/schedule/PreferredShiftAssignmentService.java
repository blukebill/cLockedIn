package com.clockedin.api.schedule;

import com.clockedin.api.schedule.dto.PreferredShiftAssignmentResponse;
import com.clockedin.api.schedule.dto.UpsertPreferredShiftAssignmentRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PreferredShiftAssignmentService {

    private final PreferredShiftAssignmentRepository preferredShiftAssignmentRepository;
    private final ShiftTemplateRepository shiftTemplateRepository;
    private final UserRepository userRepository;

    public List<PreferredShiftAssignmentResponse> getAssignments(Long restaurantId) {
        return preferredShiftAssignmentRepository
                .findByRestaurantIdOrderByShiftTemplateDayOfWeekAscShiftTemplateStartTimeAscEmployeeNameAsc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PreferredShiftAssignmentResponse upsertAssignment(
            Long restaurantId,
            UpsertPreferredShiftAssignmentRequest request
    ) {
        User employee = getEmployeeForRestaurant(request.employeeId(), restaurantId);
        ShiftTemplate template = shiftTemplateRepository.findByIdAndRestaurantId(request.shiftTemplateId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Shift template not found"));

        PreferredShiftAssignment assignment = preferredShiftAssignmentRepository
                .findByRestaurantIdAndEmployeeIdAndShiftTemplateId(
                        restaurantId,
                        employee.getId(),
                        template.getId()
                )
                .orElseGet(PreferredShiftAssignment::new);

        assignment.setRestaurant(employee.getRestaurant());
        assignment.setEmployee(employee);
        assignment.setShiftTemplate(template);

        return toResponse(preferredShiftAssignmentRepository.save(assignment));
    }

    public void deleteAssignment(Long restaurantId, Long assignmentId) {
        PreferredShiftAssignment assignment = preferredShiftAssignmentRepository.findByIdAndRestaurantId(assignmentId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Preferred shift assignment not found"));

        preferredShiftAssignmentRepository.delete(assignment);
    }

    private User getEmployeeForRestaurant(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        return employee;
    }

    private PreferredShiftAssignmentResponse toResponse(PreferredShiftAssignment assignment) {
        ShiftTemplate template = assignment.getShiftTemplate();

        return new PreferredShiftAssignmentResponse(
                assignment.getId(),
                assignment.getEmployee().getId(),
                assignment.getEmployee().getName(),
                template.getId(),
                template.getName(),
                template.getJobCode().getId(),
                template.getJobCode().getName(),
                template.getJobCode().getRank(),
                template.getDayOfWeek(),
                template.getStartTime(),
                template.getEndTime()
        );
    }
}
