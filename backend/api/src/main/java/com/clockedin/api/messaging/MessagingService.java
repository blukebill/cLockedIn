package com.clockedin.api.messaging;

import com.clockedin.api.messaging.dto.*;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ChatConversationRepository conversationRepository;
    private final ChatConversationParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatConversationReadStateRepository readStateRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getContacts(Long restaurantId, Long currentUserId) {
        return userRepository.findActiveUsersByRestaurantId(restaurantId)
                .stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .map(this::toUserSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(Long restaurantId, Long userId) {
        return conversationRepository
                .findByRestaurantIdAndParticipantsUserIdOrderByUpdatedAtDesc(restaurantId, userId)
                .stream()
                .map(conversation -> toConversationResponse(conversation, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long restaurantId, Long userId) {
        return conversationRepository
                .findByRestaurantIdAndParticipantsUserIdOrderByUpdatedAtDesc(restaurantId, userId)
                .stream()
                .mapToLong(conversation -> unreadCount(conversation.getId(), userId))
                .sum();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long restaurantId, Long userId, Long conversationId) {
        ChatConversation conversation = findConversationForParticipant(restaurantId, userId, conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(conversation.getId())
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ConversationResponse createConversation(
            Long restaurantId,
            Long currentUserId,
            Role currentRole,
            CreateConversationRequest request
    ) {
        boolean group = Boolean.TRUE.equals(request.group()) || Boolean.TRUE.equals(request.addAllEmployees());
        Set<Long> participantIds = new LinkedHashSet<>();
        participantIds.add(currentUserId);

        if (request.participantIds() != null) {
            participantIds.addAll(request.participantIds());
        }

        if (Boolean.TRUE.equals(request.addAllEmployees())) {
            userRepository.findByRestaurantIdAndRole(restaurantId, Role.EMPLOYEE)
                    .stream()
                    .map(User::getId)
                    .forEach(participantIds::add);
        }

        if (group && currentRole != Role.MANAGER) {
            throw new IllegalArgumentException("Only managers can create group chats");
        }
        if (!group && participantIds.size() != 2) {
            throw new IllegalArgumentException("Direct messages must include exactly one other person");
        }
        if (group && participantIds.size() < 2) {
            throw new IllegalArgumentException("Group chats need at least one other participant");
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
        User creator = findActiveRestaurantUser(currentUserId, restaurantId);
        List<User> participants = participantIds.stream()
                .map(participantId -> findActiveRestaurantUser(participantId, restaurantId))
                .toList();

        ChatConversation conversation = new ChatConversation();
        conversation.setRestaurant(restaurant);
        conversation.setCreatedBy(creator);
        conversation.setType(group ? ConversationType.GROUP : ConversationType.DIRECT);
        conversation.setName(group ? normalizedGroupName(request.name()) : null);
        ChatConversation saved = conversationRepository.save(conversation);

        participants.forEach(user -> {
            ChatConversationParticipant participant = new ChatConversationParticipant();
            participant.setConversation(saved);
            participant.setUser(user);
            saved.getParticipants().add(participant);
        });

        return toConversationResponse(conversationRepository.save(saved), currentUserId);
    }

    @Transactional
    public MessageResponse sendMessage(Long restaurantId, Long senderId, Long conversationId, String content) {
        ChatConversation conversation = findConversationForParticipant(restaurantId, senderId, conversationId);
        User sender = findActiveRestaurantUser(senderId, restaurantId);
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isBlank()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        if (normalizedContent.length() > 2000) {
            throw new IllegalArgumentException("Message cannot be longer than 2000 characters");
        }

        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(normalizedContent);
        ChatMessage saved = messageRepository.save(message);

        markConversationReadInternal(conversation, sender, saved);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return toMessageResponse(saved);
    }

    @Transactional
    public ConversationResponse markConversationRead(Long restaurantId, Long userId, Long conversationId) {
        ChatConversation conversation = findConversationForParticipant(restaurantId, userId, conversationId);
        User user = findActiveRestaurantUser(userId, restaurantId);
        ChatMessage lastMessage = messageRepository
                .findFirstByConversationIdOrderByCreatedAtDescIdDesc(conversation.getId())
                .orElse(null);

        markConversationReadInternal(conversation, user, lastMessage);
        return toConversationResponse(conversation, userId);
    }

    @Transactional(readOnly = true)
    public List<Long> getParticipantIds(Long restaurantId, Long conversationId) {
        ChatConversation conversation = conversationRepository.findByIdAndRestaurantId(conversationId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        return participantRepository.findByConversationIdOrderByUserNameAsc(conversation.getId())
                .stream()
                .map(participant -> participant.getUser().getId())
                .toList();
    }

    private ChatConversation findConversationForParticipant(Long restaurantId, Long userId, Long conversationId) {
        ChatConversation conversation = conversationRepository.findByIdAndRestaurantId(conversationId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new EntityNotFoundException("Conversation not found");
        }
        return conversation;
    }

    private User findActiveRestaurantUser(Long userId, Long restaurantId) {
        return userRepository.findByIdAndRestaurantId(userId, restaurantId)
                .filter(User::isEnabled)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private String normalizedGroupName(String name) {
        if (name == null || name.isBlank()) {
            return "Group Chat";
        }
        return name.trim();
    }

    private void markConversationReadInternal(ChatConversation conversation, User user, ChatMessage lastMessage) {
        ChatConversationReadState readState = readStateRepository
                .findByConversationIdAndUserId(conversation.getId(), user.getId())
                .orElseGet(() -> {
                    ChatConversationReadState nextReadState = new ChatConversationReadState();
                    nextReadState.setConversation(conversation);
                    nextReadState.setUser(user);
                    return nextReadState;
                });

        readState.setLastReadMessage(lastMessage);
        readState.setLastReadAt(LocalDateTime.now());
        readStateRepository.save(readState);
    }

    private ConversationResponse toConversationResponse(ChatConversation conversation, Long currentUserId) {
        List<UserSummaryResponse> participants = participantRepository
                .findByConversationIdOrderByUserNameAsc(conversation.getId())
                .stream()
                .map(participant -> toUserSummary(participant.getUser()))
                .toList();
        MessageResponse lastMessage = messageRepository
                .findFirstByConversationIdOrderByCreatedAtDescIdDesc(conversation.getId())
                .map(this::toMessageResponse)
                .orElse(null);

        return new ConversationResponse(
                conversation.getId(),
                conversation.getName(),
                conversation.getType().name(),
                participants,
                lastMessage,
                unreadCount(conversation.getId(), currentUserId),
                conversation.getUpdatedAt()
        );
    }

    private long unreadCount(Long conversationId, Long userId) {
        Long lastReadMessageId = readStateRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .map(ChatConversationReadState::getLastReadMessage)
                .map(ChatMessage::getId)
                .orElse(null);
        return messageRepository.countUnreadMessages(conversationId, userId, lastReadMessageId);
    }

    private MessageResponse toMessageResponse(ChatMessage message) {
        long totalOtherParticipants = participantRepository.countByConversationIdAndUserIdNot(
                message.getConversation().getId(),
                message.getSender().getId()
        );
        long readByOthersCount = readStateRepository.countReadersForMessage(
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getId()
        );

        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getContent(),
                message.getCreatedAt(),
                readByOthersCount,
                totalOtherParticipants,
                totalOtherParticipants > 0 && readByOthersCount >= totalOtherParticipants
        );
    }

    private UserSummaryResponse toUserSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
