from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import db_connection
from app.schemas import schemas
from app.database.crud import crud_habit_log

router = APIRouter(
    prefix = "/logs",
    tags = ["Habit-logs"]
)

# hàm fake id user do chưa có JWT
def get_current_user_id():
    return 1  # Giả sử user_id luôn là 1 cho mục đích demo

# 1. Check-in
@router.post("/", response_model=schemas.HabitLogResponse)
def check_in_habit(log: schemas.HabitLogCreate, db: Session = Depends(db_connection.get_db)):
    return crud_habit_log.create_or_update_habit_log(db = db, log = log)


# 2. Xem lịch sử của 1 thói quen
@router.get("/habit/{habit_id}", response_model=List[schemas.HabitLogResponse])
def get_history_by_habit(habit_id: int, skip: int = 0, limit: int = 30, db: Session = Depends(db_connection.get_db)):
    return crud_habit_log.get_logs_by_habit(db = db, habit_id = habit_id, skip = skip, limit = limit)


# 3. Xem log của User (kèm tên Habit)
@router.get("/user/{user_id}", response_model=List[schemas.HabitLogUserResponse]) 
def get_all_logs_by_user(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    return crud_habit_log.get_all_logs_by_user(db = db, user_id = get_current_user_id(), skip = skip, limit = limit)


# 4. [ADMIN] Xem toàn bộ
@router.get("/admin/all", response_model=List[schemas.HabitLogAdminResponse])
def get_all_logs_system(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    return crud_habit_log.get_all_logs_for_admin(db = db, skip = skip, limit = limit)


# 5. Update Log
@router.put("/{log_id}")
def update_log_detail(log_id: int, log_update: schemas.HabitLogUpdate, db: Session = Depends(db_connection.get_db)):
    updated_log = crud_habit_log.update_habit_log(db = db, log_id = log_id, log_update = log_update)
    if updated_log is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy log để cập nhật")
    return {"messgae":f"Đã cập nhật thành công log habit có id = {log_id}", "log": updated_log}


# 6. Delete Log
@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(db_connection.get_db)):
    deleted_log = crud_habit_log.delete_habit_log(db = db, log_id = log_id)
    if deleted_log is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy log để xóa")
    return {"message": "Xóa thành công log habit", "log": deleted_log}


