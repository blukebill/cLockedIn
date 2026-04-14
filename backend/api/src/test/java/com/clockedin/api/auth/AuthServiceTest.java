package com.clockedin.api.auth;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginWithValidCredentialsReturnsTokenAndUserDetails() {
        CustomUserDetails userDetails = userDetails("manager@example.com", "encoded-password", Role.MANAGER);
        when(userDetailsService.loadUserByUsername("manager@example.com")).thenReturn(userDetails);
        when(passwordEncoder.matches("password", "encoded-password")).thenReturn(true);
        when(jwtService.generateToken(userDetails)).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("manager@example.com", "password"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.userId()).isEqualTo(10L);
        assertThat(response.email()).isEqualTo("manager@example.com");
        assertThat(response.role()).isEqualTo("MANAGER");
        assertThat(response.restaurantId()).isEqualTo(1L);
    }

    @Test
    void loginWithUnknownEmailPropagatesUserNotFound() {
        when(userDetailsService.loadUserByUsername("missing@example.com"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("missing@example.com", "password")))
                .isInstanceOf(UsernameNotFoundException.class);

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void loginWithInvalidPasswordThrowsBadCredentials() {
        CustomUserDetails userDetails = userDetails("employee@example.com", "encoded-password", Role.EMPLOYEE);
        when(userDetailsService.loadUserByUsername("employee@example.com")).thenReturn(userDetails);
        when(passwordEncoder.matches("wrong", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("employee@example.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void loginUsesBcryptCompatiblePasswordEncoder() {
        PasswordEncoder bcrypt = new BCryptPasswordEncoder();
        String encoded = bcrypt.encode("password");
        CustomUserDetails userDetails = userDetails("employee@example.com", encoded, Role.EMPLOYEE);
        AuthService service = new AuthService(userDetailsService, bcrypt, jwtService);
        when(userDetailsService.loadUserByUsername("employee@example.com")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("jwt-token");

        LoginResponse response = service.login(new LoginRequest("employee@example.com", "password"));

        assertThat(response.token()).isEqualTo("jwt-token");
    }

    private CustomUserDetails userDetails(String email, String passwordHash, Role role) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);

        User user = new User();
        user.setId(10L);
        user.setRestaurant(restaurant);
        user.setName("Test User");
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setRole(role);
        user.setEnabled(true);

        return new CustomUserDetails(user);
    }
}
