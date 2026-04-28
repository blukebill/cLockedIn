package com.clockedin.api.schedule;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.schedule.dto.ShiftTemplateResponse;
import com.clockedin.api.schedule.dto.UpsertShiftTemplateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/shift-templates")
@RequiredArgsConstructor
public class ShiftTemplateController {

    private final ShiftTemplateService shiftTemplateService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public List<ShiftTemplateResponse> getTemplates(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return shiftTemplateService.getTemplates(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/{dayOfWeek}")
    public List<ShiftTemplateResponse> getTemplatesForDay(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable DayOfWeek dayOfWeek
    ) {
        return shiftTemplateService.getTemplatesForDay(userDetails.getRestaurantId(), dayOfWeek);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping
    public ShiftTemplateResponse upsertTemplate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertShiftTemplateRequest request
    ) {
        return shiftTemplateService.upsertTemplate(userDetails.getRestaurantId(), request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTemplate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        shiftTemplateService.deleteTemplate(userDetails.getRestaurantId(), id);
    }
}
