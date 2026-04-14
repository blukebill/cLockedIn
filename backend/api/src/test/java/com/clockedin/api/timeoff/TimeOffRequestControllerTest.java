package com.clockedin.api.timeoff;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.auth.JwtAuthenticationFilter;
import com.clockedin.api.common.GlobalExceptionHandler;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.timeoff.dto.CreateTimeOffRequest;
import com.clockedin.api.timeoff.dto.UpdateTimeOffStatusRequest;
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

import java.time.LocalDate;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = TimeOffRequestController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@Import({TimeOffRequestControllerTest.TestSecurityConfig.class, GlobalExceptionHandler.class})
class TimeOffRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TimeOffRequestService timeOffRequestService;

    @Test
    void managerOnlyRestaurantListRejectsEmployeeRole() throws Exception {
        mockMvc.perform(get("/time-off-requests").with(user(userDetails(Role.EMPLOYEE))))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCanCreateOwnRequest() throws Exception {
        CreateTimeOffRequest request = new CreateTimeOffRequest(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                "Vacation"
        );

        mockMvc.perform(post("/time-off-requests")
                        .with(user(userDetails(Role.EMPLOYEE)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void validationFailureReturnsStructuredBadRequest() throws Exception {
        CreateTimeOffRequest request = new CreateTimeOffRequest(null, null, "Vacation");

        mockMvc.perform(post("/time-off-requests")
                        .with(user(userDetails(Role.EMPLOYEE)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fields.startDate").exists())
                .andExpect(jsonPath("$.fields.endDate").exists());
    }

    @Test
    void illegalArgumentMapsToBadRequest() throws Exception {
        UpdateTimeOffStatusRequest request = new UpdateTimeOffStatusRequest("PENDING");
        when(timeOffRequestService.updateStatus(10L, 1L, request))
                .thenThrow(new IllegalArgumentException("Status cannot be set to PENDING"));

        mockMvc.perform(patch("/time-off-requests/10/status")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Status cannot be set to PENDING"));
    }

    @Test
    void entityNotFoundMapsToNotFound() throws Exception {
        UpdateTimeOffStatusRequest request = new UpdateTimeOffStatusRequest("APPROVED");
        when(timeOffRequestService.updateStatus(10L, 1L, request))
                .thenThrow(new EntityNotFoundException("Time-off request not found"));

        mockMvc.perform(patch("/time-off-requests/10/status")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Time-off request not found"));
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
