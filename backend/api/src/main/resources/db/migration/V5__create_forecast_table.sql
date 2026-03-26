create table forecast (
    id bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    forecast_date date not null,
    projected_sales numeric(10,2) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uq_forecast_restaurant_date unique (restaurant_id, forecast_date),
    constraint chk_projected_sales_nonnegative check (projected_sales >= 0)
);
