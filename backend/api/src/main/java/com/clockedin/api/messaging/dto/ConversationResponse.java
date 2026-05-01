package com.clockedin.api.messaging.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationResponse(
        Long id,
        String name,
        String type,
        List<UserSummaryResponse> participants,
        MessageResponse lastMessage,
        long unreadCount,
        LocalDateTime updatedAt
) {
}
