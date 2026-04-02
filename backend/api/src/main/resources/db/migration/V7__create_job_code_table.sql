create table job_code (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    name varchar(100) not null,
    rank integer not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),

    constraint uq_job_code_restaurant_name unique (restaurant_id, name),
    constraint uq_job_code_restaurant_rank unique (restaurant_id, rank),
    constraint chk_job_code_rank_positive check (rank >= 1)
);

create index idx_job_code_restaurant_id on job_code(restaurant_id);
