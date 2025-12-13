from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import models
from app.schemas import schemas

# 1. Logic Check-in: Tạo mới (hoặc Update nếu đã tồn tại)
def create_or_update_habit_log(db: Session, log: schemas.HabitLogCreate):
    # Tìm log cũ
    existing_log = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == log.habit_id,
        models.HabitLog.record_date == log.record_date
    ).first()
    
    if existing_log:
        # Nếu có rồi -> Update thủ công các trường cần thiết
        existing_log.status = log.status
        existing_log.value = log.value
        # (Không gọi hàm update_habit_log để tránh lệch kiểu dữ liệu)
        db.commit()
        db.refresh(existing_log)
        return existing_log

    # Nếu chưa có -> Tạo mới
    db_log = models.HabitLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# 2. Lấy lịch sử log của 1 Habit
def get_logs_by_habit(db: Session, habit_id: int, skip: int = 0, limit: int = 30):
    return db.query(models.HabitLog)\
             .filter(models.HabitLog.habit_id == habit_id)\
             .order_by(desc(models.HabitLog.record_date))\
             .offset(skip).limit(limit).all()

# 3. Lấy tất cả Log của 1 User (Kèm tên Habit)
def get_all_logs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    # Join bảng để lấy tên Habit
    results = db.query(models.HabitLog, models.Habit.name)\
        .join(models.Habit, models.HabitLog.habit_id == models.Habit.id)\
        .filter(models.Habit.user_id == user_id)\
        .order_by(desc(models.HabitLog.record_date))\
        .offset(skip).limit(limit).all()

    # Map sang Dictionary có chứa habit_name để khớp Schema mới
    final_list = []
    for log, h_name in results:
        # Convert object log sang dict rồi thêm tên habit vào
        log_dict = log.__dict__.copy() # Copy dữ liệu từ object SQLAlchemy
        log_dict['habit_name'] = h_name
        final_list.append(log_dict)
        
    return final_list

# 4. [ADMIN] Lấy tất cả (Giữ nguyên code của bạn, rất tốt)
def get_all_logs_for_admin(db: Session, skip: int = 0, limit: int = 100):
    results = db.query(models.HabitLog, models.Habit.name, models.User.full_name)\
        .join(models.Habit, models.HabitLog.habit_id == models.Habit.id)\
        .join(models.User, models.Habit.user_id == models.User.id)\
        .offset(skip).limit(limit).all()

    final_list = []
    for log, h_name, u_name in results:
        final_list.append({
            "id": log.id,
            "record_date": log.record_date,
            "status": log.status,
            "value": log.value,
            "habit_name": h_name,       
            "user_full_name": u_name    
        })
    return final_list

# 5. Các hàm phụ trợ
def get_log_by_id(db: Session, log_id: int):
    return db.query(models.HabitLog).filter(models.HabitLog.id == log_id).first()

def update_habit_log(db: Session, log_id: int, log_update: schemas.HabitLogUpdate):
    db_log = get_log_by_id(db, log_id)
    if not db_log:
        return None
    
    update_data = log_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)

    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# 6. Hàm Xóa (Bạn đã viết, mình giữ lại)
def delete_habit_log(db: Session, log_id: int):
    db_log = get_log_by_id(db, log_id)
    if db_log:
        db.delete(db_log)
        db.commit()
        return db_log # Trả về log đã xóa
    return None

