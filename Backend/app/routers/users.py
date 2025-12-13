from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.crud import crud_user
from app.database import db_connection
from app.schemas import schemas
from typing import List

# Tạo router cho user
# router giúp chia nhỏ code theo từng module
# prefix định nghĩa tiền tố chung cho tất cả các API endpoint trong router này 
# vd: thay vì users/create thì chỉ cần /create
# Tags giúp phân loại các endpoint trong tài liệu tự động của FastAPI
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# API đăng ký user mới 
@router.post("/register", response_model=schemas.UserRegister)
# response_model=schemas.UserRegister: quy định cam kết đầu ra như khuôn mẫu của schemas
def create_user(user: schemas.UserRegister, db: Session = Depends(db_connection.get_db)):
    '''
    user: schemas.UserCreate: Phần body của request sẽ được ánh xạ tự động 
    vào đối tượng user theo khuôn mẫu schemas, nếu như chưa đúng định dạng
    FastAPI sẽ trả về lỗi 422 Unprocessable Entity

    db: Session = Depends(db_connection.get_db) khai báo biến db là phiên làm việc với DB
    Depends (...) : mỗi khi API này được gọi, FastAPI sẽ tự động gọi hàm get_db() - 
    tự động kết nối đến DB, hàm chạy xong tự động đóng connection tránh rò rỉ connection
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
    return crud_user.register_user(db=db, user=user)


# API tạo user bởi admin
@router.post("/manage_create_user", response_model=schemas.UserCreatedByAdmin)
# response_model=schemas.UserCreatedByAdmin: quy định cam kết đầu ra như khuôn mẫu của schemas
def create_user(user: schemas.UserCreatedByAdmin, db: Session = Depends(db_connection.get_db)):
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
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users

# API lấy thông tin user theo ID
@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(db_connection.get_db)):
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="User không tồn tại!")
    return user

# API xóa user 
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(db_connection.get_db)):
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="User không tồn tại để xóa !")
    crud_user.delete_user_by_id(db=db,user_id=user_id)
    return {"message":f"Đã xóa thành công user có id = {user_id}"}
