from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

# Tạo Role mới
def create_role(db: Session, role: schemas.RoleCreate):
    # Dùng model_dump() để map dữ liệu từ schema sang model
    db_role = models.Role(
        **role.model_dump()
        )

    db.add(db_role)
    db.commit()
    db.refresh(db_role)

    return db_role


# Lấy danh sách (Read All)
def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Role).offset(skip).limit(limit).all()


# Lấy chi tiết 1 cái (Read One)
def get_role(db: Session, role_id: int):
    return db.query(models.Role).filter(models.Role.id == role_id).first()

# Cập nhật Role
def update_role(db: Session, role_id: int, role_update: schemas.RoleUpdate):
    db_role = get_role(db, role_id)
    # Nếu không tìm thấy role thì trả về None
    if not db_role:
        return None

    # Cập nhật các trường nếu có trong role_update
    # Chỉ cập nhật những trường mà người dùng thực sự gửi lên
    update_data = role_update.model_dump(exclude_unset=True)

    # gán giá trị mới 
    for key, value in update_data.items():
        setattr(db_role, key, value)

    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


# Xóa Role
def delete_role(db: Session, role_id: int):
    db_role = get_role(db, role_id)
    if not db_role:
        return None

    db.delete(db_role)
    db.commit()
    return db_role