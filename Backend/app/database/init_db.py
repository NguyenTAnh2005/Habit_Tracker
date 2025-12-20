from sqlalchemy.orm import Session
from app.database import models, db_connection
from app.core.utils import get_password_hash
from datetime import datetime, timedelta, date
import random

def seed_data():
    # 1. Tự lấy session DB thủ công
    db = next(db_connection.get_db())
    
    try:
        print("========== BẮT ĐẦU SEED DATA ==========")

        # ====================================================
        # PHẦN 1: TẠO ROLE (QUYỀN)
        # ====================================================
        if not db.query(models.Role).filter(models.Role.id == 1).first():
            print("[SEED] Creating Roles...")
            db.add(models.Role(id=1, name="Admin", desc="Quản trị viên hệ thống"))
            db.add(models.Role(id=2, name="User", desc="Người dùng cơ bản"))
            db.commit()

        # ====================================================
        # PHẦN 2: TẠO CATEGORIES
        # ====================================================
        categories_data = [
            {"name": "Sức Khỏe", "desc": "Tập luyện, ăn uống, ngủ nghỉ"},
            {"name": "Học Tập", "desc": "Nâng cao kiến thức, đọc sách"},
            {"name": "Công Việc", "desc": "Kỹ năng mềm, năng suất"},
            {"name": "Tài Chính", "desc": "Tiết kiệm, đầu tư"},
            {"name": "Tinh Thần", "desc": "Thiền, giải trí, thư giãn"},
            {"name": "Gia Đình", "desc": "Kết nối người thân"}
        ]
        
        for cat in categories_data:
            if not db.query(models.HabitCategory).filter(models.HabitCategory.name == cat["name"]).first():
                db.add(models.HabitCategory(name=cat["name"], desc=cat["desc"]))
        db.commit()
        print("[SEED] Categories synced.")

        # ====================================================
        # PHẦN 3: TẠO QUOTES (CÂU NÓI ĐỘNG LỰC)
        # ====================================================
        quotes_data = [
            {"quote": "Không có việc gì khó. Chỉ sợ lòng không bền. Đào núi và lấp biển. Quyết chí ắt làm nên", "author": "Hồ Chí Minh"},
            {"quote": "Không bao giờ là quá muộn để trở thành người bạn muốn.", "author": "George Eliot"},
            {"quote": "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.", "author": "Jim Rohn"},
            {"quote": "Cách tốt nhất để dự đoán tương lai là tạo ra nó.", "author": "Abraham Lincoln"},
            {"quote": "Đừng đếm ngày, hãy làm cho mỗi ngày đều đáng giá.", "author": "Muhammad Ali"}
        ]
        
        if db.query(models.MotivationQuote).count() == 0:
            print("[SEED] Creating Quotes...")
            for q in quotes_data:
                db.add(models.MotivationQuote(quote=q["quote"], author=q["author"]))
            db.commit()

        # ====================================================
        # PHẦN 4: TẠO USER & DATA MẪU (QUAN TRỌNG)
        # ====================================================
        
        # 4.1 Tạo Admin
        if not db.query(models.User).filter(models.User.role_id == 1).first():
            hashed_pwd = get_password_hash("admin123@") 
            super_admin = models.User(
                email="23050118@student.bdu.edu.vn",
                username="Admin Nguyen Anh",
                full_name="Nguyễn Tuấn Anh",
                password=hashed_pwd,
                role_id=1,
            )
            db.add(super_admin)
            db.commit()
            print("[SEED] Admin created: 23050118@student.bdu.edu.vn / admin123")

        # 4.2 Tạo User Test (Có dữ liệu mẫu để Demo)
        test_email = "anhnguyentaun@gmail.com"
        test_user = db.query(models.User).filter(models.User.email == test_email).first()
        
        if not test_user:
            print("[SEED] Creating Test User with Habits & Logs...")
            
            # Tạo User
            test_user = models.User(
                email=test_email,
                username="Test User",
                full_name="Nguyen Van Test",
                password=get_password_hash("test123@"),
                role_id=2,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

            # 👇 ĐỊNH NGHĨA NGÀY TẠO QUÁ KHỨ (25/10 năm nay)
            current_year = datetime.now().year
            # Tạo ngày 25/10 lúc 00:00:00
            past_created_at = datetime(current_year, 10, 25, 0, 0, 0)

            habits_data = [
                {
                    "name": "Uống 2 lít nước", 
                    "category_id": 1, 
                    "frequency": [2,3,4,5,6,7,8], 
                    "unit": "ml", "target_value": 2000, "color": "#3498db"
                },
                {
                    "name": "Chạy bộ buổi sáng", 
                    "category_id": 1, 
                    "frequency": [2, 4, 6, 8],    
                    "unit": "km", "target_value": 5, "color": "#e74c3c"
                },
                {
                    "name": "Đọc sách 30p", 
                    "category_id": 2, 
                    "frequency": [2,3,4,5,6,7,8], 
                    "unit": "phút", "target_value": 30, "color": "#f1c40f"
                },
                {
                    "name": "Học từ vựng T.Anh", 
                    "category_id": 2, 
                    "frequency": [3, 5, 7],       
                    "unit": "từ", "target_value": 10, "color": "#9b59b6"
                }
            ]

            created_habits = []
            for h in habits_data:
                habit = models.Habit(
                    user_id=test_user.id,
                    category_id=h["category_id"],
                    name=h["name"],
                    desc=f"Mô tả cho {h['name']}",
                    frequency=h["frequency"],
                    unit=h["unit"],
                    target_value=h["target_value"],
                    color=h["color"],
                    created_at=past_created_at # 👈 ÉP NGÀY TẠO VỀ QUÁ KHỨ
                )
                db.add(habit)
                created_habits.append(habit)
            
            db.commit()
            for h in created_habits: db.refresh(h)

            # Tạo LOGS giả trong 30 ngày qua (Để vẽ biểu đồ)
            print("   -> Tạo seed logs trong 30 ngày qua...")
            today = date.today()
            
            for i in range(30): # Duyệt qua 30 ngày gần nhất
                current_date = today - timedelta(days=i)
                weekday = current_date.weekday() + 2 # 2=Monday, 8=Sunday

                for habit in created_habits:
                    # Kiểm tra xem hôm đó có lịch tập không
                    if weekday in habit.frequency:
                        rand = random.random()
                        
                        status = "SKIPPED"
                        val = 0
                        
                        # Logic kiểm tra định lượng
                        has_target = habit.target_value and habit.target_value > 0

                        if rand < 0.7: # 70% là HOÀN THÀNH
                            status = "COMPLETED"
                            # Nếu có target thì lấy target, ko thì lấy 1 (boolean)
                            val = habit.target_value if has_target else 1.0
                            
                        elif rand < 0.85: # 15% là THẤT BẠI
                            status = "FAILED"
                            # 👇 LOGIC MỚI BẠN YÊU CẦU:
                            if has_target:
                                val = 0.0 # Có định lượng -> 0
                            else:
                                val = None # Không định lượng -> Null
                                
                        else: # 15% là BỎ QUA (SKIPPED)
                            status = "SKIPPED"
                            val = None # Skipped nên để None hoặc 0 tùy logic, ở đây để None cho sạch
                        
                        # Tạo log
                        log = models.HabitLog(
                            habit_id=habit.id,
                            value=val,
                            status=status,
                            record_date=current_date
                        )
                        db.add(log)
            
            db.commit()
            print(f"[SEED] Test User ready: {test_email} / 123456")
        else:
            print("[SEED] Test User already exists. Skipping.")

        print("========== SEED DATA HOÀN TẤT ==========")
            
    except Exception as e:
        print(f"[SEED ERROR]: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()