package com.clockedin.api.announcement;

import com.clockedin.api.announcement.dto.AnnouncementResponse;
import com.clockedin.api.announcement.dto.CreateAnnouncementRequest;
import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.messaging.MessagingWebSocketHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final MessagingWebSocketHandler webSocketHandler;

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public List<AnnouncementResponse> getAnnouncements(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return announcementService.getAnnouncements(userDetails.getRestaurantId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MANAGER')")
    public AnnouncementResponse createAnnouncement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateAnnouncementRequest request
    ) {
        AnnouncementResponse announcement = announcementService.createAnnouncement(
                userDetails.getRestaurantId(),
                userDetails.getUserId(),
                request
        );
        List<Long> recipientIds = announcementService.getAnnouncementRecipientIds(
                userDetails.getRestaurantId(),
                userDetails.getUserId()
        );
        webSocketHandler.broadcastAnnouncement(recipientIds, announcement);
        return announcement;
    }
}
