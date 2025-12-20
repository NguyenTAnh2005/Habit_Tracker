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
from calendar import monthrange
from collections import defaultdict


router = APIRouter(
    prefix = "/logs",
    tags = ["Habit-logs"]
)


# =================================================================
# API CHECK-IN THÓI QUEN 
# =================================================================
@router.post("/", response_model=schemas.HabitLogResponse)
def check_in_habit(
    log: schemas.HabitLogCreate,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Chặn check-in ngày tương lai
    today = datetime.now().date()
    if log.record_date > today:
        raise HTTPException(
            status_code=400, 
            detail=f"Không thể check-in cho tương lai! Hôm nay là {today}"
        )

    # Lấy thông tin Habit
    habit = crud_habit.get_habit_by_id(db, log.habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Thói quen không tồn tại")
        
    # Kiểm tra CHÍNH CHỦ (Admin cũng không được check-in giùm để đảm bảo tính trung thực)
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn chỉ có thể check-in thói quen của chính mình!"
        )
    
    # Kiểm tra ngày tạo (Không thể check-in cho ngày trước khi Habit được tạo)
    if log.record_date < habit.created_at.date():
         raise HTTPException(
            status_code=400, 
            detail=f"Thói quen này được tạo ngày {habit.created_at.date()}. Không thể check-in cho quá khứ trước đó!"
        )

    # Lưu Log
    return crud_habit_log.create_or_update_habit_log(db=db, log=log)


# =================================================================
# API XEM LỊCH SỬ (HISTORY)
# =================================================================
@router.get("/habit/{habit_id}", response_model=List[schemas.HabitLogResponse])
def get_history_by_habit(
    habit_id: int, 
    skip: int = 0, 
    limit: int = 30,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Thói quen không tồn tại")
        
    # Cho phép chỉ chủ sở hữu xem lịch sử thói quen
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền xem lịch sử thói quen này!"
        )

    return crud_habit_log.get_logs_by_habit(
        db, habit_id=habit_id, skip=skip, limit=limit, 
        from_date=from_date, to_date=to_date
    )


# =================================================================
# API XEM TẤT CẢ LOG CỦA USER (CHO MÀN HÌNH STATS)
# =================================================================
@router.get("/user/history", response_model=List[schemas.HabitLogUserResponse]) 
def get_all_logs_by_user(
    skip: int = 0, 
    limit: int = 100, 
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    habit_id: Optional[int] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.HabitLog).join(models.Habit).filter(
        models.Habit.user_id == current_user.id
    )

    if from_date:
        query = query.filter(models.HabitLog.record_date >= from_date)
    if to_date:
        query = query.filter(models.HabitLog.record_date <= to_date)
    if habit_id:
        query = query.filter(models.HabitLog.habit_id == habit_id)

    query = query.order_by(models.HabitLog.record_date.desc())
    logs = query.offset(skip).limit(limit).all()
    
    # Map dữ liệu thủ công để đảm bảo frontend nhận đủ info
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "habit_id": log.habit_id,
            "value": log.value,
            "unit": log.habit.unit if log.habit else "",
            "status": log.status,
            "record_date": log.record_date,
            "created_at": log.created_at,
            "habit_name": log.habit.name if log.habit else "Đã xóa"
        })
    return result


# =================================================================
#  API UPDATE (SỬA NHẬT KÝ)
# =================================================================
@router.put("/update/{log_id}")
def update_log_detail(
    log_id: int, 
    log_update: schemas.HabitLogUpdate,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_log = crud_habit_log.get_log_by_id(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log không tồn tại")
    
    habit = crud_habit.get_habit_by_id(db, db_log.habit_id)
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa nhật ký này!")

    # Cũng chặn sửa ngày thành tương lai
    if log_update.record_date and log_update.record_date > datetime.now().date():
         raise HTTPException(status_code=400, detail="Không thể chuyển nhật ký sang ngày tương lai!")

    updated_log = crud_habit_log.update_habit_log(db, log_id=log_id, log_update=log_update)
    return {"message": "Cập nhật thành công", "log": jsonable_encoder(updated_log)}



# =================================================================
# API DELETE LOG (XÓA NHẬT KÝ)
# =================================================================
@router.delete("/{log_id}")
def delete_log(
    log_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_log = crud_habit_log.get_log_by_id(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log không tồn tại")
        
    habit = crud_habit.get_habit_by_id(db, db_log.habit_id)
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa nhật ký này!")

    crud_habit_log.delete_habit_log(db, log_id=log_id)
    return {"message": "Xóa log thành công", "log": jsonable_encoder(db_log)}



# =================================================================
# API THỐNG KÊ TỈ LỆ HOÀN THÀNH NGÀY
# =================================================================
@router.get("/stats/today") 
def get_daily_stats_overall(
    date_str: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Tính % hoàn thành ngày.
    Logic: Chỉ tính những Habit đã tồn tại vào ngày target_date.
    """
    target_date = date_str if date_str else (datetime.now()).date()
    weekday_int = target_date.weekday() + 2 # (2=T2 ... 8=CN)

    # Lấy tất cả habit 
    all_habits = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)

    # Lọc ra các Habit cần làm hôm đó
    habits_today = []
    for h in all_habits:
        # Chỉ lấy các habit đã được tạo ở đúng thời điểm
        # habit đã tạo trước mới hiển hị ở ngày đó
        if h.created_at.date() > target_date:
            continue

        # kiểm tra lịch đã lên của habit với ngày trong tuần của Target date
        if not h.frequency: # Empty = Mỗi ngày
            habits_today.append(h)
        elif isinstance(h.frequency, list) and weekday_int in h.frequency:
            habits_today.append(h)
        elif isinstance(h.frequency, str) and str(weekday_int) in h.frequency: # Fallback nếu DB lưu string
            habits_today.append(h)
    
    # Nếu không có habit nào hôm đó
    if not habits_today:
        return {
            "date": target_date,
            "total_habits": 0,
            "completed_habits": 0,
            "completion_rate": 0.0
        }

    # Lấy log hoàn thành trong ngày
    habit_ids_today = [h.id for h in habits_today]

    completed_logs = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id.in_(habit_ids_today),
        models.HabitLog.record_date == target_date,
        models.HabitLog.status == "COMPLETED"
    ).all()

    # Dùng set để tránh trùng lặp habit_id
    unique_completed_habits = set([log.habit_id for log in completed_logs])
    completed_count = len(unique_completed_habits)
    total_assigned = len(habits_today)
    rate = (completed_count / total_assigned) * 100 if total_assigned > 0 else 0.0
    rate = round(rate, 2)

    return {
        "date": target_date,
        "total_assigned": total_assigned,
        "completed_count": completed_count,
        "daily_rate": round(rate, 2)
    }


# =================================================================
# API LẤY LOG TRONG NGÀY (HỖ TRỢ TRÊN UI)
# =================================================================
@router.get("/today", response_model=List[schemas.HabitLogResponse])
def get_logs_by_date(
    date_str: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API trả về danh sách các lần check-in trong ngày cụ thể.
    """
    target_date = date_str if date_str else (datetime.now()).date()
    
    # Query bảng HabitLog, join với Habit để lọc theo user_id
    todays_logs = db.query(models.HabitLog)\
        .join(models.Habit, models.HabitLog.habit_id == models.Habit.id)\
        .filter(
            models.Habit.user_id == current_user.id, 
            models.HabitLog.record_date == target_date   # Log của ngày đó
        ).all()
        
    return todays_logs


# =================================================================
# API TỰ ĐỘNG ĐIỀN FAILED CHO NHỮNG THÓI QUEN KHÔNG ĐƯỢC CHECK-IN
# =================================================================
@router.post("/auto-fail")
def auto_mark_failed_logs(
    date_str: Optional[date] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_date = date_str if date_str else datetime.now().date()
    all_habits = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)
    
    if not all_habits:
        return {"message": "User chưa có thói quen nào"}

    logs_added = 0
    
    # Quét 7 ngày quá khứ
    for i in range(1, 8): 
        check_date = current_date - timedelta(days=i)
        weekday_int = check_date.weekday() + 2 # (2=T2 ... 8=CN)
        
        habits_need_log = []
        
        for h in all_habits:
            # Chỉ xét nếu Habit đã được tạo ra TẠI hoặc TRƯỚC ngày check_date
            if h.created_at.date() > check_date:
                continue # Habit chưa sinh ra vào ngày này -> Bỏ qua

            # Check lịch (Frequency)
            is_scheduled = False
            if not h.frequency: # Empty = Mỗi ngày
                is_scheduled = True
            elif isinstance(h.frequency, list) and weekday_int in h.frequency:
                is_scheduled = True
            elif isinstance(h.frequency, str) and str(weekday_int) in h.frequency: # Fallback nếu DB lưu string
                is_scheduled = True
            
            if is_scheduled:
                habits_need_log.append(h)
        
        if not habits_need_log:
            continue

        habit_ids = [h.id for h in habits_need_log]

        # Tìm log đã tồn tại
        existing_logs = db.query(models.HabitLog).filter(
            models.HabitLog.habit_id.in_(habit_ids),
            models.HabitLog.record_date == check_date
        ).all()
        
        done_ids = {log.habit_id for log in existing_logs}
        
        # Điền FAILED cho những cái chưa có log
        for h in habits_need_log:
            if h.id not in done_ids:
                failed_log = models.HabitLog(
                    habit_id=h.id,
                    record_date=check_date,
                    status="FAILED",
                    value=0
                )
                db.add(failed_log)
                logs_added += 1
    
    if logs_added > 0:
        db.commit()
        
    return {"message": "Đã chạy auto-fail", "logs_added": logs_added}

# =================================================================
# API HEATMAP THỐNG KÊ HOÀN THÀNH THÓI QUEN THEO THÁNG
# =================================================================
@router.get("/stats/heatmap")
def get_monthly_heatmap_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now()
    target_year = year if year else now.year
    target_month = month if month else now.month

    try:
        days_in_month = monthrange(target_year, target_month)[1]
        start_date = date(target_year, target_month, 1)
        end_date = date(target_year, target_month, days_in_month)
    except:
        raise HTTPException(status_code=400, detail="Ngày tháng không hợp lệ")
    
    all_habit = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)
    
    # Lấy Logs trong tháng
    logs = db.query(models.HabitLog).join(models.Habit).filter(
        models.Habit.user_id == current_user.id,
        models.HabitLog.record_date >= start_date,
        models.HabitLog.record_date <= end_date,
        models.HabitLog.status == "COMPLETED" # Chỉ tính completed cho heatmap
    ).all()

    logs_map = defaultdict(set)
    for log in logs:
        logs_map[log.record_date].add(log.habit_id)

    heatmap_data = []
    current = start_date
    
    # Loop qua từng ngày trong tháng
    while current <= end_date:
        # Nếu ngày đang xét là tương lai -> Bỏ qua không tính toán
        if current > now.date():
             # Option: Trả về data rỗng để render ô trống
             heatmap_data.append({
                "date": current, "total": 0, "completed": 0, "rate": 0, "level": 0
            })
             current += timedelta(days=1)
             continue

        weekday_int = current.weekday() + 2
        total_task_in_day = 0
        
        for h in all_habit:
            # Chỉ tính habit nếu nó ĐÃ TỒN TẠI vào ngày 'current'
            if h.created_at.date() > current:
                continue 

            # Check lịch
            is_scheduled = False
            if not h.frequency:
                is_scheduled = True
            elif isinstance(h.frequency, list) and weekday_int in h.frequency:
                is_scheduled = True
            
            if is_scheduled:
                total_task_in_day += 1
        
        completed_count = 0
        rate = 0.0
        level = 0

        if total_task_in_day > 0:
            completed_count = len(logs_map.get(current, []))
            rate = round((completed_count / total_task_in_day) * 100, 2)
            
            if rate == 0: level = 0
            elif rate < 40: level = 1
            elif rate < 65: level = 2
            elif rate < 80: level = 3
            else: level = 4
            
        heatmap_data.append({
            "date": current,
            "total": total_task_in_day,
            "completed": completed_count,
            "rate": rate,
            "level": level
        })

        current += timedelta(days=1)
        
    return heatmap_data
        
            


