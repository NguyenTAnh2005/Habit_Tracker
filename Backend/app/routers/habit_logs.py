from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database import models
from app.database import db_connection
from app.schemas import schemas
from app.database.crud import crud_habit_log, crud_habit
from app.core.dependencies import get_current_user, get_admin_user

router = APIRouter(
    prefix = "/logs",
    tags = ["Habit-logs"]
)


# 1. Check-in
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


# 2. Xem lịch sử của 1 thói quen
@router.get("/habit/{habit_id}", response_model=List[schemas.HabitLogResponse])
def get_history_by_habit(
    habit_id: int, 
    skip: int = 0, limit: int = 30, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    # Lấy thông tin Habit
    habit = crud_habit.get_habit_by_id(db, habit_id)
    
    if not habit:
        raise HTTPException(status_code = 404, detail = "Thói quen không tồn tại")
        
    # Kiểm tra CHÍNH CHỦ
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN, 
            detail = "Bạn không có quyền xem lịch sử thói quen này!"
        )

    return crud_habit_log.get_logs_by_habit(db, habit_id=habit_id, skip=skip, limit=limit)


# 3. Xem log của User (kèm tên Habit)
@router.get("/user/{user_id}", response_model=List[schemas.HabitLogUserResponse]) 
def get_all_logs_by_user(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    return crud_habit_log.get_all_logs_by_user(db = db, user_id = current_user.id, skip = skip, limit = limit)


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


