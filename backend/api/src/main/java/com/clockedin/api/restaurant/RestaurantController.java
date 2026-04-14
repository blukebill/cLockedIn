package com.clockedin.api.restaurant;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.restaurant.dto.RestaurantSettingsResponse;
import com.clockedin.api.restaurant.dto.UpdateRestaurantSettingsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/restaurant/settings")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public RestaurantSettingsResponse getSettings(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return restaurantService.getSettings(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping
    public RestaurantSettingsResponse updateSettings(
            @Valid @RequestBody UpdateRestaurantSettingsRequest request,
            Authentication authentication
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return restaurantService.updateSettings(userDetails.getRestaurantId(), request);
    }
}
