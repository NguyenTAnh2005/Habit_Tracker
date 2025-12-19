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
@router.put("/update/{log_id}")
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
    date_str: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Tính % hoàn thành ngày.
    QUY TẮC NGHIÊM NGẶT:
    - Chỉ tính COMPLETED là 1.
    - PARTIAL, SKIPPED, FAILED đều là 0.
    """
    target_date = date_str if date_str else (datetime.now()).date()
    weekday_int = target_date.weekday() + 2
    
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
            "date": target_date,
            "total_assigned": 0,
            "completed_count": 0,
            "daily_rate": 0.0
        }

    # 3. Lấy log COMPLETED hôm nay
    habit_ids_today = [h.id for h in habits_today]
    
    # Chỉ query những cái status là COMPLETED
    completed_logs = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id.in_(habit_ids_today),
        models.HabitLog.record_date == target_date,
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
        "date": target_date,
        "total_assigned": total_assigned,
        "completed_count": completed_count,
        "daily_rate": round(rate, 2)
    }


# 8. Lấy tất cả log trong ngày hôm nay của user (Dành cho Dashboard)
@router.get("/today", response_model=List[schemas.HabitLogResponse])
def get_logs_by_date(
    date_str: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API trả về danh sách các lần check-in trong ngày hôm nay của User.
    Dùng để Frontend biết habit nào đã làm xong để tô màu xanh.
    """
    target_date = date_str if date_str else (datetime.now()).date()
    
    # Query bảng HabitLog, join với Habit để lọc đúng User
    todays_logs = db.query(models.HabitLog)\
        .join(models.Habit, models.HabitLog.habit_id == models.Habit.id)\
        .filter(
            models.Habit.user_id == current_user.id, # Của chính user này
            models.HabitLog.record_date == target_date      # Và phải là hôm nay
        ).all()
        
    return todays_logs


# 9. API Tự động điền FAILED cho các ngày quên trong quá khứ (Tối đa 7 ngày)
@router.post("/auto-fail")
def auto_mark_failed_logs(
    date_str: Optional[date] = None, # Ngày hiện tại (để tính lùi về quá khứ)
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Xác định mốc thời gian
    # Lấy ngày hiện tại (hoặc ngày client gửi) làm mốc
    current_date = date_str if date_str else datetime.now().date()
    
    # 2. Lấy tất cả Habit của User
    all_habits = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)
    if not all_habits:
        return {"message": "No habits to check"}

    logs_added = 0
    
    # 3. Quét lùi về quá khứ 7 ngày (Không tính hôm nay)
    for i in range(1, 8): 
        check_date = current_date - timedelta(days=i)
        
        # Tính thứ của ngày đang check (2=T2 ... 8=CN)
        weekday_int = check_date.weekday() + 2
        
        # Lọc ra những habit LẼ RA PHẢI LÀM trong ngày check_date
        habits_for_day = []
        for h in all_habits:
            # Nếu frequency rỗng (làm mỗi ngày) HOẶC frequency chứa thứ của check_date
            if not h.frequency:
                habits_for_day.append(h)
            elif str(weekday_int) in str(h.frequency): # Check string cho an toàn
                habits_for_day.append(h)
        
        # Nếu ngày đó không có lịch gì thì bỏ qua
        if not habits_for_day:
            continue

        # Lấy danh sách ID của habit cần làm
        habit_ids = [h.id for h in habits_for_day]

        # 4. Tìm xem những habit này đã có log trong ngày check_date chưa? ==> trả về danh sách log => làm 1 túi riêng chứa id của những habit đã có log
        existing_logs = db.query(models.HabitLog).filter(
            models.HabitLog.habit_id.in_(habit_ids),
            models.HabitLog.record_date == check_date
        ).all()
        
        # Tạo set các habit_id đã có - chừa ra những cái đã có checkin <có log> --> Miễn ktra
        done_habit_ids = set([log.habit_id for log in existing_logs])
        
        # 5. Tìm những habit CHƯA CÓ LOG -> Điền FAILED
        for habit in habits_for_day:
            if habit.id not in done_habit_ids:
                # Tạo log FAILED
                failed_log = models.HabitLog(
                    habit_id = habit.id,
                    record_date = check_date,
                    status = "FAILED",
                    value = 0
                )
                db.add(failed_log)
                logs_added += 1
    
    if logs_added > 0:
        db.commit()
        
    return {"message": "Tự động điền FAILED cho các ngày quên trong quá khứ", "Số lượng đã điền": logs_added}