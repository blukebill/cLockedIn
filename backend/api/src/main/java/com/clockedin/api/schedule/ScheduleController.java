package com.clockedin.api.schedule;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.schedule.dto.AssignShiftRequest;
import com.clockedin.api.schedule.dto.CopyScheduleWeekRequest;
import com.clockedin.api.schedule.dto.GenerateScheduleRequest;
import com.clockedin.api.schedule.dto.ScheduleResponse;
import com.clockedin.api.schedule.dto.ShiftResponse;
import com.clockedin.api.schedule.dto.UpdateShiftRequest;
import com.clockedin.api.schedule.dto.UpsertShiftRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleGenerationService scheduleGenerationService;
    private final ScheduleService scheduleService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public List<ScheduleResponse> getSchedules(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return scheduleService.getSchedules(userDetails.getRestaurantId(), startDate, endDate);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/week")
    public ScheduleResponse getScheduleWeek(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate
    ) {
        return scheduleService.getWeek(userDetails.getRestaurantId(), startDate);
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    @GetMapping("/my/week")
    public ScheduleResponse getMyScheduleWeek(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate
    ) {
        return scheduleService.getMyWeek(userDetails.getRestaurantId(), userDetails.getUserId(), startDate);
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    @GetMapping("/published/week")
    public ScheduleResponse getPublishedScheduleWeek(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate
    ) {
        return scheduleService.getPublishedWeek(userDetails.getRestaurantId(), startDate);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/{id}")
    public ScheduleResponse getSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return scheduleService.getById(userDetails.getRestaurantId(), id);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/generate")
    public ScheduleResponse generateSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody GenerateScheduleRequest request
    ) {
        return scheduleGenerationService.generateWeek(userDetails.getRestaurantId(), request.startDate());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/{id}/publish")
    public ScheduleResponse publishSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return scheduleService.publish(userDetails.getRestaurantId(), id);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/{id}/reopen")
    public ScheduleResponse reopenSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return scheduleService.reopen(userDetails.getRestaurantId(), id);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/{scheduleId}/shifts")
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftResponse createShift(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpsertShiftRequest request
    ) {
        return scheduleService.createShift(userDetails.getRestaurantId(), scheduleId, request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PatchMapping("/{scheduleId}/shifts/{shiftId}")
    public ShiftResponse updateShift(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId,
            @PathVariable Long shiftId,
            @RequestBody UpdateShiftRequest request
    ) {
        return scheduleService.updateShift(userDetails.getRestaurantId(), scheduleId, shiftId, request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PatchMapping("/{scheduleId}/shifts/{shiftId}/assign")
    public ShiftResponse assignShift(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId,
            @PathVariable Long shiftId,
            @Valid @RequestBody AssignShiftRequest request
    ) {
        return scheduleService.assignShift(
                userDetails.getRestaurantId(),
                scheduleId,
                shiftId,
                request.employeeId(),
                Boolean.TRUE.equals(request.overrideConflicts())
        );
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/{id}/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse copyScheduleWeek(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CopyScheduleWeekRequest request
    ) {
        return scheduleService.copyWeek(userDetails.getRestaurantId(), id, request.targetStartDate());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/{scheduleId}/shifts/{shiftId}/assignment")
    public ShiftResponse clearShiftAssignment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId,
            @PathVariable Long shiftId
    ) {
        return scheduleService.clearAssignment(userDetails.getRestaurantId(), scheduleId, shiftId);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/{scheduleId}/shifts/{shiftId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShift(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId,
            @PathVariable Long shiftId
    ) {
        scheduleService.deleteShift(userDetails.getRestaurantId(), scheduleId, shiftId);
    }
}
