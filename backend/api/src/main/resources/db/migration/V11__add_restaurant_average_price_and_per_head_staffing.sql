alter table restaurant
    add column average_price_per_head numeric(10, 2);

alter table restaurant
    add constraint chk_restaurant_average_price_per_head_positive
        check (average_price_per_head is null or average_price_per_head > 0);

alter table staffing_rule
    add column heads_per_employee integer;

alter table staffing_rule
    add constraint chk_staffing_rule_heads_per_employee_positive
        check (heads_per_employee is null or heads_per_employee > 0);
