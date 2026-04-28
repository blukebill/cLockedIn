package com.clockedin.api.schedule;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.jobcode.JobCodeRepository;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.schedule.dto.ShiftTemplateResponse;
import com.clockedin.api.schedule.dto.UpsertShiftTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShiftTemplateService {

    private final ShiftTemplateRepository shiftTemplateRepository;
    private final JobCodeRepository jobCodeRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public List<ShiftTemplateResponse> getTemplates(Long restaurantId) {
        return shiftTemplateRepository.findByRestaurantIdOrderByDayOfWeekAscJobCodeRankAscStartTimeAsc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftTemplateResponse> getTemplatesForDay(Long restaurantId, DayOfWeek dayOfWeek) {
        return shiftTemplateRepository.findByRestaurantIdAndDayOfWeekOrderByJobCodeRankAscStartTimeAsc(
                        restaurantId,
                        dayOfWeek
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ShiftTemplateResponse upsertTemplate(Long restaurantId, UpsertShiftTemplateRequest request) {
        validateTemplate(request);

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getJobCodeId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        ShiftTemplate template = request.getId() == null
                ? new ShiftTemplate()
                : shiftTemplateRepository.findByIdAndRestaurantId(request.getId(), restaurantId)
                        .orElseThrow(() -> new EntityNotFoundException("Shift template not found"));

        template.setRestaurant(restaurant);
        template.setJobCode(jobCode);
        template.setDayOfWeek(request.getDayOfWeek());
        template.setName(request.getName().trim());
        template.setStartTime(request.getStartTime());
        template.setEndTime(request.getEndTime());
        template.setMinEmployees(request.getMinEmployees());
        template.setMaxEmployees(request.getMaxEmployees());
        template.setActive(request.getActive());

        return toResponse(shiftTemplateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(Long restaurantId, Long templateId) {
        ShiftTemplate template = shiftTemplateRepository.findByIdAndRestaurantId(templateId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Shift template not found"));
        shiftTemplateRepository.delete(template);
    }

    private void validateTemplate(UpsertShiftTemplateRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("startTime must be before endTime");
        }

        if (request.getMinEmployees() > request.getMaxEmployees()) {
            throw new IllegalArgumentException("minEmployees cannot be greater than maxEmployees");
        }
    }

    private ShiftTemplateResponse toResponse(ShiftTemplate template) {
        return new ShiftTemplateResponse(
                template.getId(),
                template.getJobCode().getId(),
                template.getJobCode().getName(),
                template.getJobCode().getRank(),
                template.getDayOfWeek(),
                template.getName(),
                template.getStartTime(),
                template.getEndTime(),
                template.getMinEmployees(),
                template.getMaxEmployees(),
                template.isActive()
        );
    }
}
