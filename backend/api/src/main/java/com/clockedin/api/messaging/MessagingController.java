package com.clockedin.api.messaging;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.messaging.dto.*;
import com.clockedin.api.user.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;
    private final MessagingWebSocketHandler webSocketHandler;

    @GetMapping("/contacts")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public List<UserSummaryResponse> getContacts(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return messagingService.getContacts(userDetails.getRestaurantId(), userDetails.getUserId());
    }

    @GetMapping("/conversations")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public List<ConversationResponse> getConversations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return messagingService.getConversations(userDetails.getRestaurantId(), userDetails.getUserId());
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public long getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return messagingService.getUnreadCount(userDetails.getRestaurantId(), userDetails.getUserId());
    }

    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public ConversationResponse createConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CreateConversationRequest request
    ) {
        return messagingService.createConversation(
                userDetails.getRestaurantId(),
                userDetails.getUserId(),
                Role.valueOf(userDetails.getRole()),
                request
        );
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public List<MessageResponse> getMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long conversationId
    ) {
        return messagingService.getMessages(
                userDetails.getRestaurantId(),
                userDetails.getUserId(),
                conversationId
        );
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public ConversationResponse markConversationRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long conversationId
    ) {
        ConversationResponse conversation = messagingService.markConversationRead(
                userDetails.getRestaurantId(),
                userDetails.getUserId(),
                conversationId
        );
        Long lastReadMessageId = conversation.lastMessage() == null ? null : conversation.lastMessage().id();
        webSocketHandler.broadcastReadReceipt(
                userDetails.getRestaurantId(),
                new ReadReceiptResponse(conversation.id(), userDetails.getUserId(), lastReadMessageId)
        );
        return conversation;
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public MessageResponse sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse message = messagingService.sendMessage(
                userDetails.getRestaurantId(),
                userDetails.getUserId(),
                conversationId,
                request.content()
        );
        webSocketHandler.broadcastMessage(userDetails.getRestaurantId(), message);
        return message;
    }
}
