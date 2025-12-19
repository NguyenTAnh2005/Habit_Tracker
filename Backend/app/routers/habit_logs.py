from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database import models
from app.database import db_connection
from app.schemas import schemas
from app.database.crud import crud_habit_log, crud_habit
from app.core.dependencies import get_current_user, get_admin_user
from datetime import date, datetime, timedelta


router = APIRouter(
    prefix = "/logs",
    tags = ["Habit-logs"]
)


# Check-in
@router.post("/", response_model=schemas.HabitLogResponse)
def check_in_habit(
    log: schemas.HabitLogCreate,
      db: Session = Depends(db_connection.get_db),
      current_user: models.User = Depends(get_current_user)
      ):
    
    # Lấy thông tin Habit từ ID gửi lên
    habit = crud_habit.get_habit_by_id(db, log.habit_id)
    
    # Kiểm tra tồn tại
    if not habit:
        raise HTTPException(status_code = 404, detail = "Thói quen không tồn tại")
        
    # Kiểm tra CHÍNH CHỦ (Quan trọng nhất)
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN, 
            detail = "Bạn không thể check-in giùm thói quen của người khác!"
        )

    # Nếu đúng là của mình thì mới cho check-in
    return crud_habit_log.create_or_update_habit_log(db=db, log=log)


# Xem lịch sử của 1 thói quen (chính chủ hoặc admin)
@router.get("/habit/{habit_id}", response_model=List[schemas.HabitLogResponse])
def get_history_by_habit(
    habit_id: int, 
    skip: int = 0, 
    limit: int = 30,
    from_date: Optional[date] = None, # <--- Nhận tham số từ Query
    to_date: Optional[date] = None,   # <--- Nhận tham số từ Query
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Lấy thông tin Habit
    habit = crud_habit.get_habit_by_id(db, habit_id)
    
    if not habit:
        raise HTTPException(status_code = 404, detail = "Thói quen không tồn tại")
        
    # Kiểm tra CHÍNH CHỦ hoặc ADMIN
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN, 
            detail = "Bạn không có quyền xem lịch sử thói quen này!"
        )

    # Gọi CRUD mới đã update
    return crud_habit_log.get_logs_by_habit(
        db, 
        habit_id=habit_id, 
        skip=skip, 
        limit=limit,
        from_date=from_date,
        to_date=to_date
    )


# 3. Xem tất cả log của User 
@router.get("/user/history", response_model=List[schemas.HabitLogUserResponse]) 
def get_all_logs_by_user(
    skip: int = 0, 
    limit: int = 100, 
    from_date: Optional[date] = None, # <--- Ngày bắt đầu
    to_date: Optional[date] = None,   # <--- Ngày kết thúc
    habit_id: Optional[int] = None,   # <--- Lọc riêng 1 habit
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Join bảng Habit để chắc chắn lấy log của đúng user này
    query = db.query(models.HabitLog).join(models.Habit).filter(
        models.Habit.user_id == current_user.id
    )

    # 1. Lọc theo khoảng thời gian
    if from_date:
        query = query.filter(models.HabitLog.record_date >= from_date)
    if to_date:
        query = query.filter(models.HabitLog.record_date <= to_date)
    
    # 2. Lọc theo habit cụ thể (nếu user chọn filter dropdown)
    if habit_id:
        query = query.filter(models.HabitLog.habit_id == habit_id)

    # Sắp xếp ngày giảm dần (mới nhất lên đầu)
    query = query.order_by(models.HabitLog.record_date.desc())

    logs = query.offset(skip).limit(limit).all()
    result = []
    for log in logs:
        # Lấy các trường cơ bản từ log
        item = {
            "id": log.id,
            "habit_id": log.habit_id,
            "value": log.value,
            "unit": log.habit.unit if log.habit else "",
            "status": log.status,
            "record_date": log.record_date,
            "created_at": log.created_at,
            "habit_name": log.habit.name if log.habit else "Đã xóa"
        }
        result.append(item)
    return result

# 4. [ADMIN] Xem toàn bộ
@router.get("/admin/all", response_model=List[schemas.HabitLogAdminResponse])
def get_all_logs_system(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
    ):
    return crud_habit_log.get_all_logs_for_admin(db = db, skip = skip, limit = limit)


# 5. Update Log
@router.put("/{log_id}")
def update_log_detail(
    log_id: int, 
    log_update: schemas.HabitLogUpdate,
      db: Session = Depends(db_connection.get_db),
      current_user: models.User = Depends(get_current_user)
      ):
    # Tìm cái log cần sửa
    db_log = crud_habit_log.get_log_by_id(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log không tồn tại")
    
    # Từ cái log -> Tìm ra Habit cha của nó
    habit = crud_habit.get_habit_by_id(db, db_log.habit_id)
    
    # Kiểm tra xem Habit cha có phải của user đang login không
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền sửa nhật ký này!"
        )

    # Update
    updated_log = crud_habit_log.update_habit_log(db, log_id=log_id, log_update=log_update)
    return {
        "message": f"Cập nhật log {log_id} thành công", 
        "log": jsonable_encoder(updated_log)
    }


# 6. Delete Log
@router.delete("/{log_id}")
def delete_log(
    log_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    # Tìm log
    db_log = crud_habit_log.get_log_by_id(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log không tồn tại")
        
    # Check quyền sở hữu (Log -> Habit -> User)
    habit = crud_habit.get_habit_by_id(db, db_log.habit_id)
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa nhật ký này!")

    # Xóa
    crud_habit_log.delete_habit_log(db, log_id=log_id)
    return {
        "message": "Xóa log thành công", 
        "log": jsonable_encoder(db_log)
    }

# 7. Thống kê hoàn thành thói quen trong ngày hôm nay (Dành cho User)
@router.get("/stats/today") 
def get_daily_stats_overall(
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Tính % hoàn thành ngày.
    QUY TẮC NGHIÊM NGẶT:
    - Chỉ tính COMPLETED là 1.
    - PARTIAL, SKIPPED, FAILED đều là 0.
    """
    today = (datetime.now() + timedelta(hours=7)).date() 
    weekday_int = today.weekday() + 2
    
    # 1. Lấy tất cả Habit
    all_habits = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)
    
    # 2. Lọc Habit cần làm hôm nay
    habits_today = []
    for h in all_habits:
        if not h.frequency: 
             habits_today.append(h)
        elif str(weekday_int) in str(h.frequency): 
            habits_today.append(h)
            
    if not habits_today:
        return {
            "date": today,
            "total_assigned": 0,
            "completed_count": 0,
            "daily_rate": 0.0
        }

    # 3. Lấy log COMPLETED hôm nay
    habit_ids_today = [h.id for h in habits_today]
    
    # Chỉ query những cái status là COMPLETED
    completed_logs = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id.in_(habit_ids_today),
        models.HabitLog.record_date == today,
        models.HabitLog.status == "COMPLETED" # <--- CHỈ LẤY CÁI NÀY
    ).all()
    
    # Đếm số lượng habit đã hoàn thành (Dùng set để tránh log trùng)
    unique_completed_habits = set([log.habit_id for log in completed_logs])
    completed_count = len(unique_completed_habits)

    # 4. Tính toán %
    total_assigned = len(habits_today)
    
    # Công thức thuần túy: (Số lượng Hoàn thành / Tổng số phải làm) * 100
    rate = (completed_count / total_assigned) * 100 if total_assigned > 0 else 0.0
    
    return {
        "date": today,
        "total_assigned": total_assigned,
        "completed_count": completed_count,
        "daily_rate": round(rate, 2)
    }


# 8. Lấy tất cả log trong ngày hôm nay của user (Dành cho Dashboard)
@router.get("/today", response_model=List[schemas.HabitLogResponse])
def get_todays_logs(
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API trả về danh sách các lần check-in trong ngày hôm nay của User.
    Dùng để Frontend biết habit nào đã làm xong để tô màu xanh.
    """
    # Lấy ngày hiện tại (Server time + 7h cho VN)
    today = (datetime.now() + timedelta(hours=7)).date()
    
    # Query bảng HabitLog, join với Habit để lọc đúng User
    todays_logs = db.query(models.HabitLog)\
        .join(models.Habit, models.HabitLog.habit_id == models.Habit.id)\
        .filter(
            models.Habit.user_id == current_user.id, # Của chính user này
            models.HabitLog.record_date == today      # Và phải là hôm nay
        ).all()
        
    return todays_logs
