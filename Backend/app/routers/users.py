from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database.crud import crud_user
from app.database import db_connection
from app.schemas import schemas
from typing import List
from app.database import models
from app.core.dependencies import ADMIN_ROLE_ID, get_current_user, get_admin_user

# Tạo router cho user
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# API đăng ký user mới 
@router.post("/register", response_model=schemas.UserRegister)
# response_model=schemas.UserRegister: quy định cam kết đầu ra như khuôn mẫu của schemas
def create_user(user: schemas.UserRegister, db: Session = Depends(db_connection.get_db)):

    # gọi hàm kiểm tra username đã tồn tại chưa
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username đã tồn tại. Vui lòng chọn tên khác.")
    
    # gọi hàm kiểm tra email đã tồn tại chưa
    db_email = crud_user.get_user_by_email(db, email=user.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng. Vui lòng chọn email khác!")
    
    # nếu hợp lệ tạo user mới
    return crud_user.register_user(db=db, user=user)


# API tạo user bởi admin
@router.post("/manage_create_user", response_model=schemas.UserCreatedByAdmin)
# response_model=schemas.UserCreatedByAdmin: quy định cam kết đầu ra như khuôn mẫu của schemas
def create_user_by_admin(
    user: schemas.UserCreatedByAdmin,
      db: Session = Depends(db_connection.get_db),
      current_user: models.User = Depends(get_admin_user)
      ):
    
    '''
    hàm tạo user của Admin cho phép phân quyền khi tạo 
    '''

    # gọi hàm kiểm tra username đã tồn tại chưa
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username đã tồn tại. Vui lòng chọn tên khác.")
    
    # gọi hàm kiểm tra email đã tồn tại chưa
    db_email = crud_user.get_user_by_email(db, email=user.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng. Vui lòng chọn email khác!")
    
    # nếu hợp lệ tạo user mới
    return crud_user.create_user_by_admin(db=db, user=user)


# API lấy danh sách user (có phân trang)
@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0, limit: int = 100,
      db: Session = Depends(db_connection.get_db),
      current_user: models.User = Depends(get_admin_user)
      ):
    
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users

# API lấy thông tin user theo ID
@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
    ):

    user = crud_user.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="User không tồn tại!")
    return user

# API xóa user 
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
    ):

    # Tìm user cần xóa trước
    user_to_delete = crud_user.get_user_by_id(db, user_id=user_id)
    if user_to_delete is None:
        raise HTTPException(status_code=404, detail="User không tồn tại!")

    # LOGIC QUAN TRỌNG:
    # Cho phép xóa nếu: (Người gọi là Admin) HOẶC (ID người gọi == ID người cần xóa)
    is_admin = current_user.role_id == ADMIN_ROLE_ID
    is_owner = current_user.id == user_id

    list_admin = crud_user.get_users_by_role(db, role_id=ADMIN_ROLE_ID)

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa tài khoản của người khác!")
    
    # Ngăn không cho xóa Admin cuối cùng
    if is_owner and user_to_delete.role_id == ADMIN_ROLE_ID and len(list_admin) <= 1:
        raise HTTPException(status_code=403, detail="Hệ thống phải có ít nhất 1 Admin. Vui lòng liên hệ Admin khác để xóa tài khoản này!")
    
    crud_user.delete_user_by_id(db=db, user_id=user_id)
    
    return {
        "message": f"Đã xóa thành công user id {user_id}",
        "user": jsonable_encoder(user_to_delete)
    }
