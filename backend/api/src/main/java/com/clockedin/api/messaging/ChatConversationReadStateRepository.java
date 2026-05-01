package com.clockedin.api.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatConversationReadStateRepository extends JpaRepository<ChatConversationReadState, Long> {

    Optional<ChatConversationReadState> findByConversationIdAndUserId(Long conversationId, Long userId);

    @Query("""
            select count(readState)
            from ChatConversationReadState readState
            where readState.conversation.id = :conversationId
              and readState.user.id <> :senderId
              and readState.lastReadMessage is not null
              and readState.lastReadMessage.id >= :messageId
            """)
    long countReadersForMessage(
            @Param("conversationId") Long conversationId,
            @Param("senderId") Long senderId,
            @Param("messageId") Long messageId
    );
}
