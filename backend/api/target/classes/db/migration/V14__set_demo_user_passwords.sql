update users
set password_hash = '$2b$10$mhPSpcCMhAmbzOpGiyxHMO7xJ1QySX03cbTlJ.Jte0YovhD64ACcS'
where email in ('manager1@demo.com', 'employee1@demo.com', 'manager2@test.com');
