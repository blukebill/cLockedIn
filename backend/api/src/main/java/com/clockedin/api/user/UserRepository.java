package com.clockedin.api.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByRestaurantIdAndRole(Long restaurantId, Role role);

    Optional<User> findByIdAndRestaurantId(Long id, Long restaurantId);

    boolean existsByEmail(String email);
}
