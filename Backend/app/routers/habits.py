from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import models, db_connection
from app.database.crud import crud_habit, crud_habit_log
from app.schemas import schemas
from app.core import logic
# Import dependency lấy user từ token
from app.core.dependencies import get_current_user 

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)

# ========================= API DÀNH CHO ADMIN =========================
# API xem tất cả habit (Dành cho ADMIN)
@router.get("/all_habit_by_admin", response_model=List[schemas.HabitResponse])
def read_all_habits_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Kiểm tra xem có phải ADMIN không
    if current_user.role_id != 1:  # Giả sử role_id=1 là Admin
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập vào tài nguyên này."
        )
    # Nếu là Admin thì mới lấy tất cả habit
    list_habits = crud_habit.get_all_habits(db=db, skip=skip, limit=limit)
    return list_habits



# ========================= API DÀNH CHO USER =========================
# API Tạo Habit mới 
@router.post("/create", response_model=schemas.HabitResponse)
def create_habit(
    habit: schemas.HabitCreate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Lấy ID từ token người dùng để gán chủ sở hữu
    return crud_habit.create_habit(db=db, habit=habit, user_id=current_user.id)


# API Xem danh sách habit của user 
@router.get("/", response_model=List[schemas.HabitResponse])
def read_all_habit_user(
    skip: int = 0, 
    limit: int = 100, 
    category_id: Optional[int] = None, # <--- Thêm lọc Category
    search: Optional[str] = None,      # <--- Thêm tìm kiếm tên
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Chỉ lấy của user hiện tại
    query = db.query(models.Habit).filter(models.Habit.user_id == current_user.id)

    # 1. Lọc theo danh mục
    if category_id:
        query = query.filter(models.Habit.category_id == category_id)

    # 2. Tìm kiếm tên thói quen
    if search:
        query = query.filter(models.Habit.name.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()


# API Xem chi tiết habit
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
    # Nếu habit này không phải của user đang đăng nhập -> Chặn ngay hoặc trừ khi là ADMIN   
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền xem thói quen này!"
        )
    
    return habit


# 4. API Cập nhật Habit
@router.put("/update/{habit_id}", response_model=schemas.HabitResponse)
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
    
    # Kiểm tra: Có phải chính chủ không? trừ khi là ADMIN
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được sửa thói quen của người khác!")
        
    # Nếu đúng chính chủ thì mới gọi CRUD để sửa
    updated_habit = crud_habit.update_habit(db=db, habit_id=habit_id, habit_update=habit_update)
    return updated_habit


# API Xóa Habit (ĐÃ BẢO VỆ + CHECK QUYỀN)
@router.delete("/delete/{habit_id}")
def delete_habit(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user) # <--- Bắt buộc login
):
    habit = crud_habit.get_habit_by_id(db=db, habit_id=habit_id)
    
    if habit is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thói quen để xóa")
        
    # Kiểm tra: Có phải chính chủ không? trừ khi là ADMIN
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được xóa thói quen của người khác!")

    crud_habit.delete_habit(db, habit_id=habit_id)
    return {
        "message": "Đã xóa thành công",
        "habit" : jsonable_encoder(habit)
    }



# ========================== API CHỨC NĂNG =============================


# API tính toán logic cho Habit (Streak, Total Logs)
@router.get("/{habit_id}/stats", response_model=schemas.HabitStatsResponse)
def get_habit_stats(
    habit_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Lấy thông tin Habit để check quyền
    habit = crud_habit.get_habit_by_id(db, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Thói quen không tồn tại")
    
    # 2. Check chính chủ (Bảo mật) hoặc trừ khi là ADMIN
    if habit.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Không được xem thống kê của người khác!")

    # 3. Lấy toàn bộ Log của Habit này ra để tính toán
    # Lấy 1000 log gần nhất là đủ tính toán thoải mái
    all_logs = crud_habit_log.get_logs_by_habit(db, habit_id=habit_id, limit=1000) 

    # 4. Gọi hàm Logic tính toán
    current_streak = logic.calculate_current_streak(all_logs)
    
    # 5. Trả về kết quả
    return {
        "habit_id": habit.id,
        "streak": current_streak,
        "total_logs": len(all_logs)
    }
