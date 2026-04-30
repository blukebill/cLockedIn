alter table time_off_request
    add column start_time time not null default time '00:00',
    add column end_time time not null default time '23:59';
