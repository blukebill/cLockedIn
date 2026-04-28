package com.clockedin.api.staffing;

import com.clockedin.api.jobcode.JobCode;
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
            name = "uq_staffing_rule_restaurant_day_job_code",
            columnNames = {"restaurant_id", "day_of_week", "job_code_id"}
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_code_id", nullable = false)
    private JobCode jobCode;

    @Column(name = "required_count", nullable = false)
    private Integer requiredCount;

    @Column(name = "heads_per_employee")
    private Integer headsPerEmployee;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
