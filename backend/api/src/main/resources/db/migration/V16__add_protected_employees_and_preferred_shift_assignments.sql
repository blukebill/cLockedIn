alter table users
    add column protected_employee boolean not null default false;

create table preferred_shift_assignment (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    employee_id bigint not null references users(id) on delete cascade,
    shift_template_id bigint not null references shift_template(id) on delete cascade,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint uq_preferred_shift_assignment_restaurant_employee_template
        unique (restaurant_id, employee_id, shift_template_id)
);

create index idx_preferred_shift_assignment_restaurant_id
    on preferred_shift_assignment(restaurant_id);

create index idx_preferred_shift_assignment_template_id
    on preferred_shift_assignment(shift_template_id);
