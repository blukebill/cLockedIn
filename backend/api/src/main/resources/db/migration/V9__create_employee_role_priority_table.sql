create table employee_role_priority (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    employee_id bigint not null references users(id) on delete cascade,
    job_code_id bigint not null references job_code(id) on delete cascade,
    priority integer not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint uq_employee_role_priority_restaurant_employee_job_code
        unique (restaurant_id, employee_id, job_code_id),
    constraint chk_employee_role_priority_nonnegative
        check (priority >= 0)
);

create index idx_employee_role_priority_restaurant_id on employee_role_priority(restaurant_id);
create index idx_employee_role_priority_employee_id on employee_role_priority(employee_id);
create index idx_employee_role_priority_job_code_id on employee_role_priority(job_code_id);
