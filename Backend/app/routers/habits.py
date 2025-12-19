from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import models, db_connection
from app.database.crud import crud_habit, crud_habit_log
from app.schemas import schemas
from app.core import logic
from datetime import date, datetime, timedelta
# Import dependency lấy user từ token
from app.core.dependencies import get_current_user 

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)

# ========================= API QUAN TRỌNG NHẤT (ĐẶT LÊN ĐẦU) =========================

# API lấy danh sách thói quen CẦN LÀM trong ngày hôm nay
# QUAN TRỌNG: Phải đặt API này trước các API có tham số /{habit_id}
@router.get("/today", response_model=List[schemas.HabitResponse])
def get_habits_today(
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Xác định thứ trong tuần hiện tại (2 - 8)
    today = (datetime.now() + timedelta(hours=7)).date()
    weekday_int = today.weekday() + 2

    # 2. Lấy tất cả Habit của user
    all_habits = crud_habit.get_habits_by_user(db, user_id=current_user.id, limit=9999)

    habits_today = []

    for habit in all_habits:
        # Logic: Nếu frequency rỗng (làm mỗi ngày) HOẶC frequency chứa thứ hôm nay
        if not habit.frequency: 
             habits_today.append(habit)
        else:
            # Xử lý an toàn dù DB lưu dạng List hay String
            # Nếu là list [2,3,4]
            if isinstance(habit.frequency, list):
                if weekday_int in habit.frequency:
                    habits_today.append(habit)
            # Nếu là string "2,3,4" (trường hợp DB lưu kiểu cũ)
            elif str(weekday_int) in str(habit.frequency):
                 habits_today.append(habit)
    
    return habits_today


# ========================= API DÀNH CHO ADMIN =========================
@router.get("/all_habit_by_admin", response_model=List[schemas.HabitResponse])
def read_all_habits_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role_id != 1:  
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập vào tài nguyên này."
        )
    list_habits = crud_habit.get_all_habits(db=db, skip=skip, limit=limit)
    return list_habits


# ========================= API DÀNH CHO USER (CRUD CƠ BẢN) =========================

@router.post("/create", response_model=schemas.HabitResponse)
def create_habit(
    habit: schemas.HabitCreate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud_habit.create_habit(db=db, habit=habit, user_id=current_user.id)


# API Xem danh sách habit (Dùng cho trang Quản lý - HabitsPage)
@router.get("/", response_model=List[schemas.HabitResponse])
def read_all_habit_user(
    skip: int = 0, 
    limit: int = 100, 
    category_id: Optional[int] = None, 
    search: Optional[str] = None,      
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Habit).filter(models.Habit.user_id == current_user.id)

    if category_id:
        query = query.filter(models.Habit.category_id == category_id)

    if search:
        query = query.filter(models.Habit.name.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()


@router.get("/{habit_id}", response_model=schemas.HabitResponse)
def read_habit(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen!")
    
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem thói quen này!")
    
    return habit


@router.put("/update/{habit_id}", response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int, 
    habit_update: schemas.HabitUpdate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để sửa")
    
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được sửa thói quen của người khác!")
        
    updated_habit = crud_habit.update_habit(db=db, habit_id=habit_id, habit_update=habit_update)
    return updated_habit


@router.delete("/delete/{habit_id}")
def delete_habit(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để xóa")
        
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được xóa thói quen của người khác!")

    crud_habit.delete_habit(db, habit_id=habit_id)
    return {
        "message": "Đã xóa thành công",
        "habit" : jsonable_encoder(habit)
    }


# ========================== API CHỨC NĂNG THỐNG KÊ =============================

@router.get("/{habit_id}/streaks", response_model=schemas.HabitStatsResponse)
def get_habit_streak(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Thói quen không tồn tại")
    
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được xem thống kê của người khác!")

    all_logs = crud_habit_log.get_logs_by_habit(db, habit_id=habit_id, limit=1000) 
    current_streak = logic.calculate_current_streak(all_logs)
    
    return {
        "habit_id": habit.id,
        "streak": current_streak,
        "total_logs": len(all_logs)
    }