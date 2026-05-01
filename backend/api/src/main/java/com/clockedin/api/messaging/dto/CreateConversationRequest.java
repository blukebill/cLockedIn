package com.clockedin.api.messaging.dto;

import java.util.List;

public record CreateConversationRequest(
        String name,
        List<Long> participantIds,
        Boolean addAllEmployees,
        Boolean group
) {
}
