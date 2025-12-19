from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import models
from app.schemas import schemas
from typing import List, Optional
from datetime import date

# 1. Logic Check-in: Tạo mới (hoặc Update nếu đã tồn tại)
def create_or_update_habit_log(db: Session, log: schemas.HabitLogCreate):
    # Tìm log cũ
    existing_log = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == log.habit_id,
        models.HabitLog.record_date == log.record_date
    ).first()
    
    # Vì bảng HabitLog trong DB không có cột 'unit'
    log_data = log.model_dump(exclude={"unit"}) 

    if existing_log:
        # Update (Dùng log_data đã sạch)
        for key, value in log_data.items():
            setattr(existing_log, key, value)
            
        db.commit()
        db.refresh(existing_log)
        return existing_log

    # Create (Dùng log_data đã sạch)
    db_log = models.HabitLog(**log_data)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# 2. Lấy lịch sử log của 1 Habit
def get_logs_by_habit(
    db: Session, 
    habit_id: int, 
    skip: int = 0, 
    limit: int = 30, 
    from_date: Optional[date] = None, # <--- Thêm
    to_date: Optional[date] = None    # <--- Thêm
):
    query = db.query(models.HabitLog).filter(models.HabitLog.habit_id == habit_id)
    
    # Logic lọc ngày
    if from_date:
        query = query.filter(models.HabitLog.record_date >= from_date)
    if to_date:
        query = query.filter(models.HabitLog.record_date <= to_date)
        
    return query.order_by(desc(models.HabitLog.record_date))\
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

# Xoa tất cả log liên quan đến 1 habit (Dùng khi xóa habit)
def delete_logs_by_habit(db: Session, habit_id: int):
    db.query(models.HabitLog).filter(models.HabitLog.habit_id == habit_id).delete()
    db.commit()

