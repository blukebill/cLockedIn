create table staffing_rule (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    day_of_week varchar(20) not null,
    role varchar(100) not null,
    required_count integer not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint uq_staffing_rule_restaurant_day_role
        unique (restaurant_id, day_of_week, role),

    constraint chk_staffing_rule_required_count_nonnegative
        check (required_count >= 0)
);
