from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas
from app.core import utils

# hàm lấy User theo username (tên đăng nhập) tránh trùng khi đăng ký
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


# Hàm lấy user theo email tránh trùng khi đăng ký
def get_user_by_email(db:Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


#Hàm tạo user mới (đăng ký)
def register_user(db:Session, user: schemas.UserRegister):
    # hash mật khẩu trước khi lưu vào DB
    hashed_pwd = utils.get_password_hash(user.password)

    # Tạo bản ghi đối tượng User mới
    db_user = models.User(
        username = user.username,
        full_name = user.full_name,
        password = hashed_pwd,
        email = user.email,
        role_id = 2 
    )

    # Lưu vào DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

# Hàm tạo user bởi Admin 
def create_user_by_admin(db:Session, user: schemas.UserCreatedByAdmin):
    # hash mật khẩu trước khi lưu vào DB
    hashed_pwd = utils.get_password_hash(user.password)

    # Tạo bản ghi đối tượng User mới, dùng model dump để map sẵn phần schema đã tạo
    db_user = models.User(
        **user.model_dump(exclude={'password'}),
        password = hashed_pwd
    )

    # Lưu vào DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

# Hàm lấy danh sách các User (có phân trang)
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# Lấy thông tin user theo ID
def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# Hàm xóa user theo ID
def delete_user_by_id(db: Session, user_id:int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user