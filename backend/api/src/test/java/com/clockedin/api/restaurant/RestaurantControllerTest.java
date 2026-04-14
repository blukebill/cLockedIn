package com.clockedin.api.restaurant;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.auth.JwtAuthenticationFilter;
import com.clockedin.api.common.GlobalExceptionHandler;
import com.clockedin.api.restaurant.dto.RestaurantSettingsResponse;
import com.clockedin.api.restaurant.dto.UpdateRestaurantSettingsRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = RestaurantController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@Import({RestaurantControllerTest.TestSecurityConfig.class, GlobalExceptionHandler.class})
class RestaurantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RestaurantService restaurantService;

    @Test
    void managerCanReadRestaurantSettings() throws Exception {
        when(restaurantService.getSettings(1L))
                .thenReturn(new RestaurantSettingsResponse(1L, "Clocked In Cafe", new BigDecimal("20.00")));

        mockMvc.perform(get("/restaurant/settings").with(user(userDetails(Role.MANAGER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averagePricePerHead").value(20.00));
    }

    @Test
    void managerCanUpdateAveragePricePerHead() throws Exception {
        UpdateRestaurantSettingsRequest request = new UpdateRestaurantSettingsRequest();
        request.setAveragePricePerHead(new BigDecimal("22.50"));
        when(restaurantService.updateSettings(org.mockito.ArgumentMatchers.eq(1L), any(UpdateRestaurantSettingsRequest.class)))
                .thenReturn(new RestaurantSettingsResponse(1L, "Clocked In Cafe", new BigDecimal("22.50")));

        mockMvc.perform(put("/restaurant/settings")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averagePricePerHead").value(22.50));
    }

    @Test
    void restaurantSettingsRejectEmployeeRole() throws Exception {
        mockMvc.perform(get("/restaurant/settings").with(user(userDetails(Role.EMPLOYEE))))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationFailureReturnsStructuredBadRequest() throws Exception {
        UpdateRestaurantSettingsRequest request = new UpdateRestaurantSettingsRequest();
        request.setAveragePricePerHead(BigDecimal.ZERO);

        mockMvc.perform(put("/restaurant/settings")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fields.averagePricePerHead").exists());
    }

    @Test
    void entityNotFoundMapsToNotFound() throws Exception {
        when(restaurantService.getSettings(1L)).thenThrow(new EntityNotFoundException("Restaurant not found"));

        mockMvc.perform(get("/restaurant/settings").with(user(userDetails(Role.MANAGER))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Restaurant not found"));
    }

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {

        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());

            return http.build();
        }
    }

    private CustomUserDetails userDetails(Role role) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);

        User user = new User();
        user.setId(role == Role.MANAGER ? 1L : 2L);
        user.setRestaurant(restaurant);
        user.setName(role.name());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setEnabled(true);
        return new CustomUserDetails(user);
    }
}
