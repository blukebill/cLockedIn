create table announcement (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    sender_id bigint not null references users(id) on delete cascade,
    title varchar(120) not null,
    body varchar(2000) not null,
    created_at timestamp not null default now()
);

create index idx_announcement_restaurant_created_at
    on announcement(restaurant_id, created_at);
