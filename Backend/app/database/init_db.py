from sqlalchemy.orm import Session
from app.database import models, db_connection
from app.core.utils import get_password_hash


def seed_data():
    # 1. Tự lấy session DB thủ công (vì hàm này không chạy qua API request)
    db = next(db_connection.get_db())
    
    try:
        # --- TẠO ROLE ---
        # Kiểm tra xem Role Admin (id=1) đã có chưa
        admin_role = db.query(models.Role).filter(models.Role.id == 1).first()
        if not admin_role:
            print("[SEED] Creating Roles...")
            role_admin = models.Role(id=1, name="Admin", desc="Quản trị viên hệ thống")
            role_user = models.Role(id=2, name="User", desc="Người dùng cơ bản")
            db.add(role_admin)
            db.add(role_user)
            db.commit()
        
        # --- TẠO ADMIN USER ---
        # Kiểm tra xem đã có user nào giữ quyền Admin (role_id=1) chưa
        admin_user = db.query(models.User).filter(models.User.role_id == 1).first()
        if not admin_user:
            print("[SEED] Creating Super Admin Account...")
            # Tạo mật khẩu hash
            hashed_pwd = get_password_hash("admin123") 
            
            super_admin = models.User(
                email="23050118@student.bdu.edu.vn",
                username="Admin Vippro",
                full_name="Nguyễn Tuấn Anh",
                password=hashed_pwd,
                role_id=1,      # Gán quyền Admin
            )
            db.add(super_admin)
            db.commit()
            print("[SEED] Admin created: 23050118@student.bdu.edu.vn / admin123")
        else:
            print("[SEED] Admin account already exists.")
            
    except Exception as e:
        print(f"[SEED ERROR]: {e}")
    finally:
        # Quan trọng: Phải đóng kết nối sau khi dùng xong
        db.close()