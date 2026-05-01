package com.clockedin.api.messaging.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long conversationId,
        Long senderId,
        String senderName,
        String content,
        LocalDateTime createdAt,
        long readByOthersCount,
        long totalOtherParticipants,
        boolean readByAll
) {
}
