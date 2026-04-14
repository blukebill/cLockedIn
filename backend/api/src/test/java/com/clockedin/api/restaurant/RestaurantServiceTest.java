package com.clockedin.api.restaurant;

import com.clockedin.api.restaurant.dto.RestaurantSettingsResponse;
import com.clockedin.api.restaurant.dto.UpdateRestaurantSettingsRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @Test
    void getSettingsReturnsAveragePricePerHeadForManagersRestaurant() {
        Restaurant restaurant = restaurant("25.00");
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));

        RestaurantSettingsResponse response = restaurantService.getSettings(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Clocked In Cafe");
        assertThat(response.getAveragePricePerHead()).isEqualByComparingTo("25.00");
    }

    @Test
    void updateSettingsPersistsAveragePricePerHeadForManagersRestaurant() {
        Restaurant restaurant = restaurant(null);
        UpdateRestaurantSettingsRequest request = new UpdateRestaurantSettingsRequest();
        request.setAveragePricePerHead(new BigDecimal("22.50"));
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(restaurantRepository.save(restaurant)).thenReturn(restaurant);

        RestaurantSettingsResponse response = restaurantService.updateSettings(1L, request);

        assertThat(response.getAveragePricePerHead()).isEqualByComparingTo("22.50");
        assertThat(restaurant.getAveragePricePerHead()).isEqualByComparingTo("22.50");
        verify(restaurantRepository).save(restaurant);
    }

    @Test
    void missingRestaurantThrowsNotFound() {
        when(restaurantRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> restaurantService.getSettings(404L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("Restaurant not found");
    }

    private Restaurant restaurant(String averagePricePerHead) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);
        restaurant.setName("Clocked In Cafe");
        if (averagePricePerHead != null) {
            restaurant.setAveragePricePerHead(new BigDecimal(averagePricePerHead));
        }
        return restaurant;
    }
}
