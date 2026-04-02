package com.clockedin.api.rolepriority;

import com.clockedin.api.jobcode.JobCode;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "employee_role_priority",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_employee_role_priority_restaurant_employee_job_code",
                        columnNames = {"restaurant_id", "employee_id", "job_code_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class EmployeeRolePriority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_code_id", nullable = false)
    private JobCode jobCode;

    @Column(nullable = false)
    private Integer priority;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
