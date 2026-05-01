create table chat_conversation_read_state (
    id bigserial primary key,
    conversation_id bigint not null references chat_conversation(id) on delete cascade,
    user_id bigint not null references users(id) on delete cascade,
    last_read_message_id bigint references chat_message(id) on delete set null,
    last_read_at timestamp not null default now(),
    constraint uq_chat_conversation_read_state unique (conversation_id, user_id)
);

create index idx_chat_conversation_read_state_user_id
    on chat_conversation_read_state(user_id);
