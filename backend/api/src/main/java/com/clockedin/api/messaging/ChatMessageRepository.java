package com.clockedin.api.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAscIdAsc(Long conversationId);

    Optional<ChatMessage> findFirstByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId);

    @Query("""
            select count(message)
            from ChatMessage message
            where message.conversation.id = :conversationId
              and message.sender.id <> :userId
              and (:lastReadMessageId is null or message.id > :lastReadMessageId)
            """)
    long countUnreadMessages(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("lastReadMessageId") Long lastReadMessageId
    );
}
