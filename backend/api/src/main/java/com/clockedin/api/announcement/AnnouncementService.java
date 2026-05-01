package com.clockedin.api.announcement;

import com.clockedin.api.announcement.dto.AnnouncementResponse;
import com.clockedin.api.announcement.dto.CreateAnnouncementRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(Long restaurantId) {
        return announcementRepository.findByRestaurantIdOrderByCreatedAtDescIdDesc(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(
            Long restaurantId,
            Long senderId,
            CreateAnnouncementRequest request
    ) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));
        User sender = userRepository.findByIdAndRestaurantId(senderId, restaurantId)
                .filter(User::isEnabled)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Announcement announcement = new Announcement();
        announcement.setRestaurant(restaurant);
        announcement.setSender(sender);
        announcement.setTitle(request.title().trim());
        announcement.setBody(request.body().trim());

        return toResponse(announcementRepository.save(announcement));
    }

    @Transactional(readOnly = true)
    public List<Long> getAnnouncementRecipientIds(Long restaurantId, Long senderId) {
        return userRepository.findActiveUsersByRestaurantId(restaurantId)
                .stream()
                .map(User::getId)
                .filter(userId -> !userId.equals(senderId))
                .toList();
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getSender().getId(),
                announcement.getSender().getName(),
                announcement.getTitle(),
                announcement.getBody(),
                announcement.getCreatedAt()
        );
    }
}
