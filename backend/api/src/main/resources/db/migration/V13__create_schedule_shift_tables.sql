create table shift_template (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    job_code_id bigint not null references job_code(id) on delete cascade,
    day_of_week varchar(20) not null,
    name varchar(100) not null,
    start_time time not null,
    end_time time not null,
    min_employees integer not null default 0,
    max_employees integer not null default 1,
    active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint chk_shift_template_times check (start_time < end_time),
    constraint chk_shift_template_min_employees_nonnegative check (min_employees >= 0),
    constraint chk_shift_template_max_employees_positive check (max_employees >= 1),
    constraint chk_shift_template_min_not_greater_than_max check (min_employees <= max_employees),
    constraint uq_shift_template_restaurant_job_day_name
        unique (restaurant_id, job_code_id, day_of_week, name)
);

create index idx_shift_template_restaurant_day_job
    on shift_template(restaurant_id, day_of_week, job_code_id);

create table schedule (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    status varchar(20) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint uq_schedule_restaurant_range unique (restaurant_id, start_date, end_date),
    constraint chk_schedule_date_range check (start_date <= end_date)
);

create index idx_schedule_restaurant_start_date on schedule(restaurant_id, start_date);

create table shift (
    id bigserial primary key,
    schedule_id bigint not null references schedule(id) on delete cascade,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    job_code_id bigint not null references job_code(id) on delete cascade,
    shift_template_id bigint references shift_template(id) on delete set null,
    employee_id bigint references users(id) on delete set null,
    shift_date date not null,
    start_time time not null,
    end_time time not null,
    status varchar(20) not null,
    source varchar(20) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint chk_shift_times check (start_time < end_time)
);

create index idx_shift_schedule_id on shift(schedule_id);
create index idx_shift_restaurant_date on shift(restaurant_id, shift_date);
create index idx_shift_employee_date on shift(employee_id, shift_date);
