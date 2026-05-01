package com.clockedin.api.messaging;

import com.clockedin.api.announcement.dto.AnnouncementResponse;
import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.auth.CustomUserDetailsService;
import com.clockedin.api.auth.JwtService;
import com.clockedin.api.messaging.dto.MessageResponse;
import com.clockedin.api.messaging.dto.ReadReceiptResponse;
import com.clockedin.api.messaging.dto.WebSocketInboundMessage;
import com.clockedin.api.messaging.dto.WebSocketOutboundMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class MessagingWebSocketHandler extends TextWebSocketHandler {

    private static final String USER_ID_ATTRIBUTE = "userId";
    private static final String RESTAURANT_ID_ATTRIBUTE = "restaurantId";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final MessagingService messagingService;
    private final ObjectMapper objectMapper;
    private final Map<Long, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = tokenFromUri(session.getUri());
        if (token == null || token.isBlank()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing token"));
            return;
        }

        try {
            String email = jwtService.extractEmail(token);
            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(token, userDetails)) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
                return;
            }

            session.getAttributes().put(USER_ID_ATTRIBUTE, userDetails.getUserId());
            session.getAttributes().put(RESTAURANT_ID_ATTRIBUTE, userDetails.getRestaurantId());
            session.getAttributes().put(
                    "authentication",
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
            );
            sessionsByUserId
                    .computeIfAbsent(userDetails.getUserId(), ignored -> ConcurrentHashMap.newKeySet())
                    .add(session);
        } catch (Exception ex) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
        Long restaurantId = (Long) session.getAttributes().get(RESTAURANT_ID_ATTRIBUTE);
        if (userId == null || restaurantId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Unauthenticated"));
            return;
        }

        try {
            WebSocketInboundMessage inbound = objectMapper.readValue(message.getPayload(), WebSocketInboundMessage.class);
            MessageResponse saved = messagingService.sendMessage(
                    restaurantId,
                    userId,
                    inbound.conversationId(),
                    inbound.content()
            );
            broadcastMessage(restaurantId, saved);
        } catch (Exception ex) {
            sendJson(session, Map.of("type", "ERROR", "error", ex.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId == null) return;

        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null) return;

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUserId.remove(userId);
        }
    }

    public void broadcastMessage(Long restaurantId, MessageResponse message) {
        List<Long> participantIds = messagingService.getParticipantIds(restaurantId, message.conversationId());
        WebSocketOutboundMessage outbound = new WebSocketOutboundMessage("MESSAGE", message, null, null);
        broadcastToParticipants(participantIds, outbound);
    }

    public void broadcastReadReceipt(Long restaurantId, ReadReceiptResponse readReceipt) {
        List<Long> participantIds = messagingService.getParticipantIds(restaurantId, readReceipt.conversationId());
        WebSocketOutboundMessage outbound = new WebSocketOutboundMessage("READ_RECEIPT", null, readReceipt, null);
        broadcastToParticipants(participantIds, outbound);
    }

    public void broadcastAnnouncement(List<Long> recipientIds, AnnouncementResponse announcement) {
        WebSocketOutboundMessage outbound = new WebSocketOutboundMessage("ANNOUNCEMENT", null, null, announcement);
        broadcastToParticipants(recipientIds, outbound);
    }

    private void broadcastToParticipants(List<Long> participantIds, WebSocketOutboundMessage outbound) {
        participantIds.forEach(userId -> {
            Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
            if (sessions == null) return;
            sessions.forEach(session -> sendJson(session, outbound));
        });
    }

    private String tokenFromUri(URI uri) {
        if (uri == null) return null;
        return UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst("token");
    }

    private void sendJson(WebSocketSession session, Object payload) {
        if (!session.isOpen()) return;
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        } catch (IOException ignored) {
        }
    }
}
