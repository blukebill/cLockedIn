package com.clockedin.api.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatConversationParticipantRepository extends JpaRepository<ChatConversationParticipant, Long> {

    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);

    long countByConversationIdAndUserIdNot(Long conversationId, Long userId);

    List<ChatConversationParticipant> findByConversationIdOrderByUserNameAsc(Long conversationId);
}
