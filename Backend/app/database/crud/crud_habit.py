from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas
from app.core import utils

# Tạo Habit mới 
def create_habit(db: Session, habit: schemas.HabitCreate, user_id: int):
    # Sử dụng **habit.model_dump để map dl từ schema ra model
    # habit là một object của Pydantic (Schema).
    # .model_dump() chuyển nó thành Python Dict thuần: {'name': 'Gym', 'description': 'Tập thể dục'}.
    # Dấu ** (double asterisk) là kỹ thuật Unpacking. Nó "bóc" cái dictionary đó ra để điền vào hàm tạo model
    # Thay vì viết models.Habit(name='Gym', description='...') thì chỉ cần viết ngắn gọn như trên.

    habit = models.Habit(
        **habit.model_dump(),
        user_id = user_id 
    )

    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


# Lấy danh sách Habit của user (có phân trang)
def get_habits_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Habit).filter(models.Habit.user_id == user_id).offset(skip).limit(limit).all()


# Lấy thông tin Habit theo ID
def get_habit_by_id(db: Session, habit_id: int):
    return db.query(models.Habit).filter(models.Habit.id == habit_id).first()


# Cập nhật Habit 
def update_habit(db: Session, habit_id: int, habit_update: schemas.HabitUpdate):
    habit = get_habit_by_id(db, habit_id)
    if not habit:
        return None # Nếu tìm thấy habit thì báo lỗi None và router báo lỗi 
    
    # chọn dữ liệu cần sửa 
    # Nó bảo Pydantic là: "Chỉ lấy những trường mà người dùng thực sự gửi lên.
    #  Nếu người dùng không gửi trường description, thì đừng có đưa description: None vào đây".
    update_data = habit_update.model_dump(exclude_unset=True)

    # Gán giá trị mới 
    for key, value in update_data.items():
        setattr(habit, key, value)

    # Lưu DB
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


# Xóa Habit theo ID
def delete_habit(db: Session, habit_id: int):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if habit:
        db.delete(habit)
        db.commit()
    return habit