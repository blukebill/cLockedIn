package com.clockedin.api.jobcode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobCodeRepository extends JpaRepository<JobCode, Long> {

    List<JobCode> findByRestaurantIdOrderByRankAsc(Long restaurantId);

    Optional<JobCode> findByIdAndRestaurantId(Long id, Long restaurantId);

    boolean existsByRestaurantIdAndName(Long restaurantId, String name);

    boolean existsByRestaurantIdAndNameAndIdNot(Long restaurantId, String name, Long id);

    boolean existsByRestaurantIdAndRank(Long restaurantId, Integer rank);

    boolean existsByRestaurantIdAndRankAndIdNot(Long restaurantId, Integer rank, Long id);

    @Query("select coalesce(max(j.rank), 0) from JobCode j where j.restaurant.id = :restaurantId")
    Integer findMaxRankByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update JobCode j
            set j.rank = j.rank + :offset
            where j.restaurant.id = :restaurantId
              and j.rank >= :startRank
            """)
    int offsetRanksAtOrAbove(
            @Param("restaurantId") Long restaurantId,
            @Param("startRank") Integer startRank,
            @Param("offset") Integer offset
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update JobCode j
            set j.rank = j.rank - :offset + :delta
            where j.restaurant.id = :restaurantId
              and j.rank >= :startRank
            """)
    int normalizeOffsetRanksAtOrAbove(
            @Param("restaurantId") Long restaurantId,
            @Param("startRank") Integer startRank,
            @Param("offset") Integer offset,
            @Param("delta") Integer delta
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update JobCode j
            set j.rank = j.rank + :offset
            where j.restaurant.id = :restaurantId
              and j.rank >= :startRank
              and j.rank <= :endRank
            """)
    int offsetRanksBetween(
            @Param("restaurantId") Long restaurantId,
            @Param("startRank") Integer startRank,
            @Param("endRank") Integer endRank,
            @Param("offset") Integer offset
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update JobCode j
            set j.rank = j.rank - :offset + :delta
            where j.restaurant.id = :restaurantId
              and j.rank >= :startRank
              and j.rank <= :endRank
            """)
    int normalizeOffsetRanksBetween(
            @Param("restaurantId") Long restaurantId,
            @Param("startRank") Integer startRank,
            @Param("endRank") Integer endRank,
            @Param("offset") Integer offset,
            @Param("delta") Integer delta
    );
}
