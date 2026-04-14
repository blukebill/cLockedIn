alter table employee_job_code
    drop constraint uq_employee_job_code_restaurant_employee;

alter table employee_job_code
    add constraint uq_employee_job_code_restaurant_employee_job_code
        unique (restaurant_id, employee_id, job_code_id);
