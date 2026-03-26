create table time_off_request (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    reason varchar(500),
    status varchar(20) not null,
    created_at timestamp not null default now()
);
