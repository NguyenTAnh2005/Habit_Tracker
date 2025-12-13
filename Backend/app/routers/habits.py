from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List

from app.database import models, db_connection
from app.database.crud import crud_habit
from app.schemas import schemas
# Import dependency lấy user từ token
from app.core.dependencies import get_current_user 

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)

# 1. API Tạo Habit mới (ĐÃ BẢO VỆ)
@router.post("/create", response_model=schemas.HabitResponse)
def create_habit(
    habit: schemas.HabitCreate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Lấy ID từ token người dùng để gán chủ sở hữu
    return crud_habit.create_habit(db=db, habit=habit, user_id=current_user.id)


# 2. API Xem danh sách habit của user (ĐÃ BẢO VỆ)
@router.get("/", response_model=List[schemas.HabitResponse])
def read_all_habit(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user) # <--- Cần token để biết ai đang xem
):
    # Thay vì dùng get_fake_user_id(), ta dùng ID thật
    list_habits = crud_habit.get_habits_by_user(
        db=db, 
        user_id=current_user.id, # <--- Chỉ lấy habit của người đang đăng nhập
        skip=skip, 
        limit=limit 
    )
    return list_habits


# 3. API Xem chi tiết habit (ĐÃ BẢO VỆ + CHECK QUYỀN)
@router.get("/{habit_id}", response_model=schemas.HabitResponse)
def read_habit(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    # Kiểm tra tồn tại
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen!")
    
    # Kiểm tra CHỦ SỞ HỮU
    # Nếu habit này không phải của user đang đăng nhập -> Chặn ngay
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền xem thói quen này!"
        )
    
    return habit


# 4. API Cập nhật Habit (ĐÃ BẢO VỆ + CHECK QUYỀN)
@router.put("/{habit_id}", response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int, 
    habit_update: schemas.HabitUpdate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user) # <--- Bắt buộc login
):
    # Lấy habit cũ lên xem là của ai
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để sửa")
    
    # Kiểm tra: Có phải chính chủ không?
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không được sửa thói quen của người khác!")
        
    # Nếu đúng chính chủ thì mới gọi CRUD để sửa
    updated_habit = crud_habit.update_habit(db=db, habit_id=habit_id, habit_update=habit_update)
    return updated_habit


# 5. API Xóa Habit (ĐÃ BẢO VỆ + CHECK QUYỀN)
@router.delete("/{habit_id}")
def delete_habit(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user) # <--- Bắt buộc login
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để xóa")
        
    # Kiểm tra: Có phải chính chủ không?
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không được xóa thói quen của người khác!")

    crud_habit.delete_habit(db, habit_id=habit_id)
    return {
        "message": "Đã xóa thành công",
        "habit" : jsonable_encoder(habit)
    }