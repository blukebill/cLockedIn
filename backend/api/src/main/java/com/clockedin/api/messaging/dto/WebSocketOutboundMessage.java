package com.clockedin.api.messaging.dto;

public record WebSocketOutboundMessage(
        String type,
        MessageResponse message,
        ReadReceiptResponse readReceipt
) {
}
