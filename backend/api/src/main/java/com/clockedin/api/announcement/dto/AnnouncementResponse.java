package com.clockedin.api.announcement.dto;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        Long senderId,
        String senderName,
        String title,
        String body,
        LocalDateTime createdAt
) {
}
