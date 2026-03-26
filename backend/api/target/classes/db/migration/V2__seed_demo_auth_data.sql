INSERT INTO restaurant (id, name)
VALUES
    (1, 'Demo Grill'),
    (2, 'Test Diner');

INSERT INTO users (restaurant_id, name, email, password_hash, role, enabled)
VALUES
    (1, 'Manager One', 'manager1@demo.com', '$2a$10$8HbQEbpI5VtQueBvvcaUHOlqOUkzQBxuMgh7LevSPEGvQzifqxPKC', 'MANAGER', true),
    (1, 'Employee One', 'employee1@demo.com', '$2a$10$8HbQEbpI5VtQueBvvcaUHOlqOUkzQBxuMgh7LevSPEGvQzifqxPKC', 'EMPLOYEE', true),
    (2, 'Manager Two', 'manager2@test.com', '$2a$10$8HbQEbpI5VtQueBvvcaUHOlqOUkzQBxuMgh7LevSPEGvQzifqxPKC', 'MANAGER', true);
