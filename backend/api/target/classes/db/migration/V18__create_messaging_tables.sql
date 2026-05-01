create table chat_conversation (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id) on delete cascade,
    created_by_user_id bigint not null references users(id) on delete cascade,
    name varchar(120),
    type varchar(20) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index idx_chat_conversation_restaurant_id
    on chat_conversation(restaurant_id);

create table chat_conversation_participant (
    id bigserial primary key,
    conversation_id bigint not null references chat_conversation(id) on delete cascade,
    user_id bigint not null references users(id) on delete cascade,
    created_at timestamp not null default now(),
    constraint uq_chat_conversation_participant unique (conversation_id, user_id)
);

create index idx_chat_conversation_participant_user_id
    on chat_conversation_participant(user_id);

create table chat_message (
    id bigserial primary key,
    conversation_id bigint not null references chat_conversation(id) on delete cascade,
    sender_id bigint not null references users(id) on delete cascade,
    content varchar(2000) not null,
    created_at timestamp not null default now()
);

create index idx_chat_message_conversation_created_at
    on chat_message(conversation_id, created_at);
