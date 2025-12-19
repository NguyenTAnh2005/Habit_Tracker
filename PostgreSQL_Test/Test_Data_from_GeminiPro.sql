-- 1. Tạo một User chuyên để test (nếu chưa có)
-- Username: 'test_user', Pass: '123456' (đã hash)
INSERT INTO users (username, full_name, password, email, role_id, created_at)
VALUES 
('test_user', 'Nguyen Van Test', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn95nPnRaLELoJsPOV.DA9.nmQKK'
, 'test_user@gmail.com', 2, NOW())
ON CONFLICT (username) DO NOTHING;

-- ==========================================================
-- TỰ ĐỘNG TẠO DỮ LIỆU LOGIC (Dùng DO BLOCK của Postgres)
-- ==========================================================
DO $$
DECLARE 
    v_user_id INTEGER;
    v_cat_suckhoe INTEGER;
    v_cat_hoctap INTEGER;
    v_habit_anuong INTEGER;
    v_habit_docsach INTEGER;
BEGIN
    -- A. LẤY ID CẦN THIẾT
    -- 1. Lấy ID của ông 'test_user' vừa tạo
    SELECT id INTO v_user_id FROM users WHERE username = 'test_user';
    
    -- 2. Lấy ID Category (Do Python đã tạo sẵn tên tiếng Việt, ta query theo tên)
    -- Lưu ý: Nếu tên trong DB bạn khác dấu/viết hoa, hãy sửa lại ở đây cho khớp
    SELECT id INTO v_cat_suckhoe FROM habit_categories WHERE name = 'Sức Khỏe';
    SELECT id INTO v_cat_hoctap FROM habit_categories WHERE name = 'Hoc Tap'; -- Hoặc 'Học Tập' tùy lúc nãy Python chạy ra gì
    
    -- Fallback: Nếu không tìm thấy tên category chính xác, lấy đại ID 1 và 2
    IF v_cat_suckhoe IS NULL THEN v_cat_suckhoe := 1; END IF;
    IF v_cat_hoctap IS NULL THEN v_cat_hoctap := 2; END IF;


    -- B. TẠO THÓI QUEN (HABITS)
    
    -- Habit 1: Ăn uống Healthy (Sẽ tạo Streak ngon)
    INSERT INTO habits (user_id, category_id, name, "desc", frequency, unit, target_value, color, created_at)
    VALUES (v_user_id, v_cat_suckhoe, 'Eat Clean', 'An nhieu rau xanh', ARRAY[0,1,2,3,4,5,6], 'bữa', 3.0, '#4CAF50', NOW())
    RETURNING id INTO v_habit_anuong;

    -- Habit 2: Đọc Sách (Sẽ tạo Streak bị đứt)
    INSERT INTO habits (user_id, category_id, name, "desc", frequency, unit, target_value, color, created_at)
    VALUES (v_user_id, v_cat_hoctap, 'Doc Sach', 'Doc 20 trang moi ngay', ARRAY[0,1,2,3,4,5,6], 'trang', 20.0, '#2196F3', NOW())
    RETURNING id INTO v_habit_docsach;


    -- C. TẠO NHẬT KÝ (LOGS) - QUAN TRỌNG NHẤT
    
    -- >> KỊCH BẢN 1: 'Eat Clean' - Làm liên tục 5 ngày qua (Tính cả hôm nay)
    INSERT INTO habit_logs (habit_id, value, status, record_date, created_at) VALUES 
    (v_habit_anuong, 3.0, 'COMPLETED', CURRENT_DATE, NOW()),                 -- Hôm nay (T0)
    (v_habit_anuong, 3.0, 'COMPLETED', CURRENT_DATE - INTERVAL '1 day', NOW()), -- Hôm qua (T-1)
    (v_habit_anuong, 3.0, 'COMPLETED', CURRENT_DATE - INTERVAL '2 day', NOW()), -- Hôm kia (T-2)
    (v_habit_anuong, 3.0, 'COMPLETED', CURRENT_DATE - INTERVAL '3 day', NOW()), -- (T-3)
    (v_habit_anuong, 3.0, 'COMPLETED', CURRENT_DATE - INTERVAL '4 day', NOW()); -- (T-4)
    -- => KẾT QUẢ MONG ĐỢI: STREAK = 5
    
    
    -- >> KỊCH BẢN 2: 'Doc Sach' - Hôm qua QUÊN làm, hôm kia có làm
    INSERT INTO habit_logs (habit_id, value, status, record_date, created_at) VALUES 
    (v_habit_docsach, 20.0, 'COMPLETED', CURRENT_DATE, NOW()),                  -- Hôm nay có làm
    -- [MẤT LOG NGÀY HÔM QUA] -> Đứt chuỗi tại đây
    (v_habit_docsach, 20.0, 'COMPLETED', CURRENT_DATE - INTERVAL '2 day', NOW()), -- Hôm kia có làm
    (v_habit_docsach, 25.0, 'COMPLETED', CURRENT_DATE - INTERVAL '3 day', NOW()); 
    -- => KẾT QUẢ MONG ĐỢI: STREAK = 1 (Chỉ tính chuỗi mới bắt đầu từ hôm nay)

END $$;