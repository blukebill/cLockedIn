package com.clockedin.api.user;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.auth.JwtAuthenticationFilter;
import com.clockedin.api.common.GlobalExceptionHandler;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.dto.CreateEmployeeRequest;
import com.clockedin.api.user.dto.EmployeeResponse;
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

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = EmployeeController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@Import({EmployeeControllerTest.TestSecurityConfig.class, GlobalExceptionHandler.class})
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployeeService employeeService;

    @Test
    void managerEndpointRejectsEmployeeRole() throws Exception {
        mockMvc.perform(get("/employees").with(user(userDetails(Role.EMPLOYEE))))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanCreateEmployee() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest("New Employee", "new@example.com", "password123");
        when(employeeService.createEmployee(request, 1L))
                .thenReturn(new EmployeeResponse(10L, "New Employee", "new@example.com", "EMPLOYEE", 1L, true));

        mockMvc.perform(post("/employees")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"));
    }

    @Test
    void validationFailureReturnsStructuredBadRequest() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest("", "not-email", "short");

        mockMvc.perform(post("/employees")
                        .with(user(userDetails(Role.MANAGER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void entityNotFoundMapsToNotFound() throws Exception {
        when(employeeService.getEmployeeById(404L, 1L)).thenThrow(new EntityNotFoundException("Employee not found"));

        mockMvc.perform(get("/employees/404").with(user(userDetails(Role.MANAGER))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found"));
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
