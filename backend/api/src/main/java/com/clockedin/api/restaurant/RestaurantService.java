package com.clockedin.api.restaurant;

import com.clockedin.api.restaurant.dto.RestaurantSettingsResponse;
import com.clockedin.api.restaurant.dto.UpdateRestaurantSettingsRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantSettingsResponse getSettings(Long restaurantId) {
        Restaurant restaurant = getRestaurant(restaurantId);
        return toResponse(restaurant);
    }

    public RestaurantSettingsResponse updateSettings(Long restaurantId, UpdateRestaurantSettingsRequest request) {
        Restaurant restaurant = getRestaurant(restaurantId);
        restaurant.setAveragePricePerHead(request.getAveragePricePerHead());
        return toResponse(restaurantRepository.save(restaurant));
    }

    private Restaurant getRestaurant(Long restaurantId) {
        return restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
    }

    private RestaurantSettingsResponse toResponse(Restaurant restaurant) {
        return new RestaurantSettingsResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getAveragePricePerHead()
        );
    }
}
