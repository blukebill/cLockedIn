package com.clockedin.api.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    Optional<ChatConversation> findByIdAndRestaurantId(Long id, Long restaurantId);

    List<ChatConversation> findByRestaurantIdAndParticipantsUserIdOrderByUpdatedAtDesc(Long restaurantId, Long userId);
}
