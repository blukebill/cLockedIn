package com.clockedin.api.messaging.dto;

import com.clockedin.api.announcement.dto.AnnouncementResponse;

public record WebSocketOutboundMessage(
        String type,
        MessageResponse message,
        ReadReceiptResponse readReceipt,
        AnnouncementResponse announcement
) {
}
