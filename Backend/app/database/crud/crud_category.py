from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

# Tạo Category mới
def create_category(db: Session, category: schemas.HabitCategoryCreate):
    # Dùng model_dump() để map dữ liệu từ schema sang model
    db_category = models.HabitCategory(
        **category.model_dump()
        )

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category

# Lấy danh sách (Read All)
def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.HabitCategory).offset(skip).limit(limit).all()

# Lấy chi tiết 1 cái (Read One)
def get_category(db: Session, category_id: int):
    return db.query(models.HabitCategory).filter(models.HabitCategory.id == category_id).first()

# Cập nhật Category
def update_category(db: Session, category_id: int, category_update: schemas.HabitCategoryUpdate):
    db_category = get_category(db, category_id)
    # Nếu không tìm thấy category thì trả về None
    if not db_category:
        return None

    # Cập nhật các trường nếu có trong category_update
    # Chỉ cập nhật những trường mà người dùng thực sự gửi lên
    update_data = category_update.model_dump(exclude_unset=True)

    # gán giá trị mới 
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category