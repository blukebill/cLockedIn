alter table staffing_rule
    add column job_code_id bigint;

update staffing_rule sr
set job_code_id = jc.id
from job_code jc
where jc.restaurant_id = sr.restaurant_id
  and jc.name = upper(trim(sr.role));

do $$
begin
    if exists (select 1 from staffing_rule where job_code_id is null) then
        raise exception 'Every staffing_rule.role must match an existing job_code.name before migrating staffing rules to job codes';
    end if;
end $$;

alter table staffing_rule
    alter column job_code_id set not null;

alter table staffing_rule
    add constraint fk_staffing_rule_job_code
        foreign key (job_code_id) references job_code(id) on delete cascade;

alter table staffing_rule
    drop constraint uq_staffing_rule_restaurant_day_role;

alter table staffing_rule
    add constraint uq_staffing_rule_restaurant_day_job_code
        unique (restaurant_id, day_of_week, job_code_id);

alter table staffing_rule
    drop column role;

create index idx_staffing_rule_job_code_id on staffing_rule(job_code_id);
