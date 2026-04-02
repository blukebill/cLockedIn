package com.clockedin.api.jobcode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobCodeRepository extends JpaRepository<JobCode, Long> {

    List<JobCode> findByRestaurantIdOrderByRankAsc(Long restaurantId);

    Optional<JobCode> findByIdAndRestaurantId(Long id, Long restaurantId);

    boolean existsByRestaurantIdAndName(Long restaurantId, String name);

    boolean existsByRestaurantIdAndNameAndIdNot(Long restaurantId, String name, Long id);

    boolean existsByRestaurantIdAndRank(Long restaurantId, Integer rank);

    boolean existsByRestaurantIdAndRankAndIdNot(Long restaurantId, Integer rank, Long id);
}
