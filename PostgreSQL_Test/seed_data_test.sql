select * from RoleS;
-- Thêm Role Admin (ID 1)
INSERT INTO roles (name, "desc") VALUES ('Admin', 'Quan tri vien he thong');

-- Thêm Role User (ID 2) - Đây là cái quan trọng để code chạy đc
INSERT INTO roles (name, "desc") VALUES ('User', 'Nguoi dung thong thuong');

INSERT INTO habit_categories (name, "desc") VALUES ('Suc Khoe', 'Tap luyen, an uong');
INSERT INTO habit_categories (name, "desc") VALUES ('Hoc Tap', 'Nang cao kien thuc');

select * from users
select * from roles
select * from habit_categories
select * from habits
select * from habit_logs
select * from motivation_quotes
delete from users
delete from roles
delete from habit_categories

TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE habit_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE habits RESTART IDENTITY CASCADE;
TRUNCATE TABLE habit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE motivation_quotes RESTART IDENTITY CASCADE;


-- Reset lại bộ đếm ID cho bảng roles nhảy tới số lớn nhất hiện tại
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));