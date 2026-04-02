create table employee_job_code (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    employee_id bigint not null references users(id) on delete cascade,
    job_code_id bigint not null references job_code(id) on delete cascade,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint uq_employee_job_code_restaurant_employee unique (restaurant_id, employee_id)
);

create index idx_employee_job_code_employee_id on employee_job_code(employee_id);
create index idx_employee_job_code_job_code_id on employee_job_code(job_code_id);
create index idx_employee_job_code_restaurant_id on employee_job_code(restaurant_id);
