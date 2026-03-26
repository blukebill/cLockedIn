package com.clockedin.api.staffing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "staffing_rule",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_staffing_rule_restaurant_day_role",
            columnNames = {"restaurant_id", "day_of_week", "role"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
public class StaffingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 20)
    private DayOfWeek dayOfWeek;

    @Column(name = "role", nullable = false, length = 100)
    private String role;

    @Column(name = "required_count", nullable = false)
    private Integer requiredCount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
