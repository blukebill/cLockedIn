package com.clockedin.api.messaging.dto;

public record WebSocketInboundMessage(
        Long conversationId,
        String content
) {
}
