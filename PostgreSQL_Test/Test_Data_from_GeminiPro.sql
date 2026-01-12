-- ============================================================
-- 1. TẠO ROLE (Nếu chưa có)
-- ============================================================
INSERT INTO roles (id, name, "desc") VALUES
(1, 'Admin', 'Quản trị viên hệ thống'),
(2, 'User', 'Người dùng cơ bản')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. TẠO CATEGORIES
-- ============================================================
INSERT INTO habit_categories (name, "desc") VALUES
('Sức Khỏe', 'Tập luyện, ăn uống, ngủ nghỉ'),
('Học Tập', 'Nâng cao kiến thức, đọc sách'),
('Công Việc', 'Kỹ năng mềm, năng suất'),
('Tài Chính', 'Tiết kiệm, đầu tư'),
('Tinh Thần', 'Thiền, giải trí, thư giãn'),
('Gia Đình', 'Kết nối người thân')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. TẠO QUOTES
-- ============================================================
INSERT INTO motivation_quotes (quote, author) 
SELECT quote, author FROM (VALUES 
    ('Không có việc gì khó. Chỉ sợ lòng không bền. Đào núi và lấp biển. Quyết chí ắt làm nên', 'Hồ Chí Minh'),
    ('Không bao giờ là quá muộn để trở thành người bạn muốn.', 'George Eliot'),
    ('Kỷ luật là cầu nối giữa mục tiêu và thành tựu.', 'Jim Rohn'),
    ('Cách tốt nhất để dự đoán tương lai là tạo ra nó.', 'Abraham Lincoln'),
    ('Đừng đếm ngày, hãy làm cho mỗi ngày đều đáng giá.', 'Muhammad Ali')
) AS q(quote, author)
WHERE NOT EXISTS (SELECT 1 FROM motivation_quotes);

-- ============================================================
-- 4. TẠO USERS
-- ============================================================

-- ⚠️ LƯU Ý: Password bên dưới là hash mẫu của chuỗi "admin123@" và "test123@".
-- Nếu hệ thống của bạn dùng thuật toán hash khác (salt khác), bạn có thể không login được.
-- Tốt nhất: Copy chuỗi hash từ một user cũ đã login được và paste vào đây.

-- 4.1 Tạo Admin (Password: admin123@)
INSERT INTO users (email, username, full_name, password, role_id, created_at)
VALUES (
    '23050118@student.bdu.edu.vn', 
    'Admin Nguyen Anh', 
    'Nguyễn Tuấn Anh', 
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn96pzvPNPbk.Q.7v7.yTu.f.y.e', -- Hash mẫu
    1,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 4.2 Tạo Test User (Password: test123@)
INSERT INTO users (email, username, full_name, password, role_id, created_at)
VALUES (
    'anhnguyentaun@gmail.com', 
    'Test User', 
    'Nguyen Van Test', 
    '$2b$12$8.Un.t/u.y.e.SampleHashForTest123@...', -- Hash mẫu, bạn nên thay bằng hash thật
    2,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 5. TẠO HABITS CHO TEST USER
-- ============================================================
-- Lấy ID của Test User
DO $$
DECLARE 
    v_user_id INT;
    v_cat_suckhoe INT;
    v_cat_hoctap INT;
    v_created_date TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'anhnguyentaun@gmail.com';
    SELECT id INTO v_cat_suckhoe FROM habit_categories WHERE name = 'Sức Khỏe';
    SELECT id INTO v_cat_hoctap FROM habit_categories WHERE name = 'Học Tập';
    
    -- Giả lập ngày tạo là 25/10 năm nay (lúc 00:00)
    v_created_date := MAKE_TIMESTAMP(EXTRACT(YEAR FROM NOW())::INT, 10, 25, 0, 0, 0);

    IF v_user_id IS NOT NULL THEN
        -- Insert Habits
        INSERT INTO habits (user_id, category_id, name, "desc", frequency, unit, target_value, color, created_at) VALUES
        (v_user_id, v_cat_suckhoe, 'Uống 2 lít nước', 'Mô tả cho Uống 2 lít nước', ARRAY[2,3,4,5,6,7,8], 'ml', 2000, '#3498db', v_created_date),
        (v_user_id, v_cat_suckhoe, 'Chạy bộ buổi sáng', 'Mô tả cho Chạy bộ buổi sáng', ARRAY[2,4,6,8], 'km', 5, '#e74c3c', v_created_date),
        (v_user_id, v_cat_hoctap, 'Đọc sách 30p', 'Mô tả cho Đọc sách 30p', ARRAY[2,3,4,5,6,7,8], 'phút', 30, '#f1c40f', v_created_date),
        (v_user_id, v_cat_hoctap, 'Học từ vựng T.Anh', 'Mô tả cho Học từ vựng T.Anh', ARRAY[3,5,7], 'từ', 10, '#9b59b6', v_created_date);
    END IF;
END $$;

-- ============================================================
-- 6. TẠO LOGS TRONG 30 NGÀY QUA (LOGIC PHỨC TẠP)
-- ============================================================
INSERT INTO habit_logs (habit_id, value, status, record_date)
SELECT 
    h.id as habit_id,
    -- Logic Value:
    CASE 
        WHEN r.rand_val < 0.7 THEN -- COMPLETED
            CASE WHEN h.target_value > 0 THEN h.target_value ELSE 1 END
        WHEN r.rand_val < 0.85 THEN -- FAILED
            CASE WHEN h.target_value > 0 THEN 0 ELSE NULL END
        ELSE -- SKIPPED
            NULL
    END as value,
    -- Logic Status:
    CASE 
        WHEN r.rand_val < 0.7 THEN 'COMPLETED'
        WHEN r.rand_val < 0.85 THEN 'FAILED'
        ELSE 'SKIPPED'
    END as status,
    d.day as record_date
FROM 
    -- 1. Tạo chuỗi 30 ngày gần nhất
    generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day') AS d(day)
CROSS JOIN 
    -- 2. Lấy habits của Test User
    habits h
JOIN 
    users u ON h.user_id = u.id
CROSS JOIN LATERAL 
    -- 3. Sinh số ngẫu nhiên cho mỗi dòng
    (SELECT random() as rand_val) r
WHERE 
    u.email = 'anhnguyentaun@gmail.com'
    -- 4. Logic check thứ trong tuần (Postgres ISODOW: 1=Mon...7=Sun)
    -- Python logic của bạn: 2=Mon...8=Sun => Cần +1 cho ISODOW
    AND (EXTRACT(ISODOW FROM d.day) + 1) = ANY(h.frequency)
    -- 5. Chỉ tạo log nếu ngày đó >= ngày tạo habit
    AND d.day >= h.created_at::date;