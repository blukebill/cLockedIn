package com.clockedin.api.auth;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/test/secure")
    public String secure(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return "Authenticated as " + userDetails.getEmail();
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/test/manager")
    public String managerOnly(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return "Manager access granted for restaurant " + userDetails.getRestaurantId();
    }
}
