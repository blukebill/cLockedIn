package com.clockedin.api.auth;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return new MeResponse(
                userDetails.getUserId(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.getRestaurantId()
        );
    }
}
