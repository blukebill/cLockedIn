package com.clockedin.api.messaging.dto;

public record ReadReceiptResponse(
        Long conversationId,
        Long readerId,
        Long lastReadMessageId
) {
}
