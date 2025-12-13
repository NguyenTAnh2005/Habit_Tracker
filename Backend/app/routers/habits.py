from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.crud import crud_habit
from app.database import db_connection
from app.schemas import schemas
from typing import List

# Tạo router cho habit
router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)

# function lấy id user fake vì chưa có JWT
def get_fake_user_id():
    return 1

# API tạo Habit mới
@router.post("/create", response_model=schemas.HabitResponse)
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(db_connection.get_db)):
    '''
    Tạo Habit mới, fake user id do chưa có JWT
    '''
    user_id = get_fake_user_id()
    return crud_habit.create_habit(db=db, habit=habit, user_id=user_id)


# API Xem danh sách habit của user
@router.get("/", response_model=List[schemas.HabitResponse])
def read_all_habit(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    '''
    Xem tất cả các Habit của User
    '''
    user_id = get_fake_user_id()
    list_habits = crud_habit.get_habits_by_user(db=db, user_id=user_id, skip=skip, limit=limit )
    return list_habits


# API Xem chi tiet habit 
@router.get("/{habit_id}",response_model=schemas.HabitResponse)
def read_habit(habit_id: int, db: Session = Depends(db_connection.get_db)):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen!")
    return habit


# API Cập nhật Habit 
@router.put("/{habit_id}",response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int, 
    habit_update: schemas.HabitUpdate, 
    db: Session = Depends(db_connection.get_db)
    ):
    updated_habit = crud_habit.update_habit(db=db, habit_id=habit_id, habit_update=habit_update)
    if updated_habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để sửa")
    return updated_habit


# API Xoa Habit
@router.delete("/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(db_connection.get_db)):
    deleted_habit = crud_habit.delete_habit(db, habit_id=habit_id)
    if deleted_habit is None:
         raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để xóa")
    return {"message": "Đã xóa thành công"}