package com.clockedin.api.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "restaurant")
    Optional<User> findByEmail(String email);

    List<User> findByRestaurantIdAndRole(Long restaurantId, Role role);

    @Query("""
            select user
            from User user
            where user.restaurant.id = :restaurantId
              and user.enabled = true
            order by user.name asc
            """)
    List<User> findActiveUsersByRestaurantId(@Param("restaurantId") Long restaurantId);

    Optional<User> findByIdAndRestaurantId(Long id, Long restaurantId);

    boolean existsByEmail(String email);
}
