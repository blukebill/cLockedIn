package com.clockedin.api.auth;

import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "ildg5PmJtWdfKYFJYtcttG8evOCyr7q7YvjvNSBHlNQ=";

    private final JwtService jwtService = new JwtService(SECRET, 86_400_000L);

    @Test
    void generatedTokenContainsExpectedClaims() {
        CustomUserDetails userDetails = userDetails();

        String token = jwtService.generateToken(userDetails);

        assertThat(jwtService.parseClaims(token).getSubject()).isEqualTo("manager@example.com");
        assertThat(jwtService.parseClaims(token).get("userId", Integer.class)).isEqualTo(42);
        assertThat(jwtService.parseClaims(token).get("role", String.class)).isEqualTo("MANAGER");
        assertThat(jwtService.parseClaims(token).get("restaurantId", Integer.class)).isEqualTo(7);
    }

    @Test
    void validTokenParsesAndValidates() {
        CustomUserDetails userDetails = userDetails();
        String token = jwtService.generateToken(userDetails);

        assertThat(jwtService.extractEmail(token)).isEqualTo("manager@example.com");
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
        assertThat(jwtService.isTokenExpired(token)).isFalse();
    }

    @Test
    void invalidTokenThrowsJwtException() {
        assertThatThrownBy(() -> jwtService.extractEmail("not-a-token"))
                .isInstanceOf(JwtException.class);
    }

    private CustomUserDetails userDetails() {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(7L);

        User user = new User();
        user.setId(42L);
        user.setRestaurant(restaurant);
        user.setName("Manager");
        user.setEmail("manager@example.com");
        user.setPasswordHash("encoded-password");
        user.setRole(Role.MANAGER);

        return new CustomUserDetails(user);
    }
}
