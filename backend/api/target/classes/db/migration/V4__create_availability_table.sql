CREATE TABLE availability (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id BIGINT NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    available BOOLEAN NOT NULL,
    start_time TIME,
    end_time TIME,
    CONSTRAINT uq_availability_employee_day UNIQUE (employee_id, day_of_week),
    CONSTRAINT chk_availability_time_fields CHECK (
        (available = false AND start_time IS NULL AND end_time IS NULL)
        OR
        (available = true AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
);
