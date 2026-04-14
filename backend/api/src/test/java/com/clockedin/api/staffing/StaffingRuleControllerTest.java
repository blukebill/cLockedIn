package com.clockedin.api.staffing;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.auth.JwtAuthenticationFilter;
import com.clockedin.api.common.GlobalExceptionHandler;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.staffing.dto.StaffingRuleResponse;
import com.clockedin.api.staffing.dto.UpsertStaffingRuleRequest;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.DayOfWeek;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = StaffingRuleController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@Import({StaffingRuleControllerTest.TestSecurityConfig.class, GlobalExceptionHandler.class})
class StaffingRuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private StaffingRuleService staffingRuleService;

    @Test
    void managerCanSetHeadsPerEmployeeRequirement() throws Exception {
        UpsertStaffingRuleRequest request = request(25);
        when(staffingRuleService.upsertRule(eq(1L), any(UpsertStaffingRuleRequest.class)))
                .thenReturn(new StaffingRuleResponse(1L, DayOfWeek.MONDAY, "SERVER", 2, 25));

        mockMvc.perform(put("/staffing-rules")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headsPerEmployee").value(25));
    }

    @Test
    void invalidHeadsPerEmployeeReturnsStructuredBadRequest() throws Exception {
        mockMvc.perform(put("/staffing-rules")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request(0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fields.headsPerEmployee").exists());
    }

    @Test
    void managerEndpointRejectsEmployeeRole() throws Exception {
        mockMvc.perform(put("/staffing-rules")
                        .with(user(userDetails(Role.EMPLOYEE)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request(25))))
                .andExpect(status().isForbidden());
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

    private UpsertStaffingRuleRequest request(Integer headsPerEmployee) {
        UpsertStaffingRuleRequest request = new UpsertStaffingRuleRequest();
        request.setDayOfWeek(DayOfWeek.MONDAY);
        request.setRole("server");
        request.setRequiredCount(2);
        request.setHeadsPerEmployee(headsPerEmployee);
        return request;
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
