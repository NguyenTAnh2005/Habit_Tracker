from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database.crud import crud_user, crud_habit, crud_habit_log
from app.database import db_connection
from app.schemas import schemas
from typing import List, Optional
from sqlalchemy import or_
from app.database import models
from app.core.dependencies import ADMIN_ROLE_ID, get_current_user, get_admin_user
from app.core.utils import check_password, get_password_hash, generate_random_password, send_email_background


# Tạo router cho user
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ========================= API DÀNH CHO USER =========================
# API lấy thông tin của chính user đang đăng nhập
@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Lấy thông tin của chính user đang đăng nhập (Dựa vào Token)
    """
    return current_user

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


# API xóa user theo ID (Chỉ dành cho Admin)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user) 
    ):

    # Tìm user cần xóa
    user_to_delete = crud_user.get_user_by_id(db, user_id=user_id)
    if user_to_delete is None:
        raise HTTPException(status_code=404, detail="User không tồn tại!")

    # CHECK RULE: Admin không được tự xóa chính mình
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400, 
            detail="Bạn không thể tự xóa tài khoản Admin của chính mình!"
        )

    # CHECK RULE: Bảo vệ Admin (nếu người bị xóa là Admin)
    if user_to_delete.role_id == 1:
        # Tổng số Admin đang có
        admin_count = db.query(models.User).filter(models.User.role_id == 1).count()
        
        # Nếu chỉ còn 1 Admin (là chính mình) thì chặn (logic trên đã chặn rồi)
        # Nhưng nếu còn 2 Admin, A xóa B -> còn 1 Admin -> OK
        # Tuy nhiên, để an toàn tuyệt đối, có thể chặn xóa Admin cuối cùng
        if admin_count <= 1:
             raise HTTPException(
                status_code=400, 
                detail="Hệ thống phải có ít nhất 1 Admin. Không thể xóa!"
            )

    # Lưu dữ liệu ra biến riêng TRƯỚC KHI XÓA (để return không bị lỗi)
    deleted_user_info = jsonable_encoder(user_to_delete)

    # Thực hiện xóa
    crud_user.delete_user_by_id(db=db, user_id=user_id)
    
    # Trả về kết quả
    return {
        "message": f"Đã xóa thành công user id {user_id}",
        "user": deleted_user_info 
    }
# API cập nhật thông tin user 
@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate, # Schema này chỉ chứa full_name, email... (ko có role_id)
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Dùng chính current_user để update -> Không sợ sửa nhầm của người khác
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    
    if user_update.email:
        # Nếu đổi email, cần check xem email mới có trùng ai ko
        existing_email = crud_user.get_user_by_email(db, email=user_update.email)
        if existing_email and existing_email.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
        current_user.email = user_update.email
    
    if user_update.username:
        # Nếu đổi username, cần check xem username mới có trùng ai ko
        existing_user = crud_user.get_user_by_username(db, username=user_update.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username này đã tồn tại!")
        current_user.username = user_update.username

    if user_update.password:
        # Hash lại mật khẩu
        hashed_password = get_password_hash(user_update.password)
        current_user.password = hashed_password

    db.commit()
    db.refresh(current_user)
    return current_user

# ========================= API DÀNH CHO ADMIN =========================
# API tạo user 
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


# API lấy danh sách user (có phân trang, lọc theo tên, email)
@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,   # <--- Thêm tìm kiếm
    role_id: Optional[int] = None,  # <--- Thêm lọc quyền
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
):
    # Khởi tạo query
    query = db.query(models.User)

    # 1. Lọc theo role nếu có
    if role_id:
        query = query.filter(models.User.role_id == role_id)
    
    # 2. Tìm kiếm (Username hoặc Email hoặc Tên thật)
    if search:
        search_fmt = f"%{search}%"
        # Dùng ilike để tìm không phân biệt hoa thường (Postgres)
        query = query.filter(
            or_(
                models.User.username.ilike(search_fmt),
                models.User.email.ilike(search_fmt),
                models.User.full_name.ilike(search_fmt)
            )
        )
    
    # 3. Phân trang & Trả về
    return query.offset(skip).limit(limit).all()


# 2.  API Admin update User (Để Admin đổi Role, reset thông tin user khác)
@router.put("/admin/update/{user_id}", response_model=schemas.UserResponse)
def update_user_by_admin(
    user_id: int, 
    user_update: schemas.UserUpdateByAdmin,
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
):
    # Tìm user
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User không tồn tại")
    # Admin không thể tự hạ quyền của mình
    if user_id == current_user.id:
        if user_update.role_id and user_update.role_id != 1:
            raise HTTPException(
                status_code=400, 
                detail="Bạn không thể tự hạ quyền Admin của chính mình. Hãy nhờ Admin khác làm điều này!"
            )
    # Update thủ công các trường Admin gửi lên
    if user_update.username:
        # Nếu đổi username, cần check xem username mới có trùng ai ko
        existing_user = crud_user.get_user_by_username(db, username=user_update.username)
        if existing_user and existing_user.id != db_user.id:
            raise HTTPException(status_code=400, detail="Username này đã tồn tại!")
        db_user.username = user_update.username
            
    if user_update.full_name:
        db_user.full_name = user_update.full_name
    if user_update.email:
        db_user.email = user_update.email
    if user_update.role_id:
        db_user.role_id = user_update.role_id
    
    db.commit()
    db.refresh(db_user)
    return db_user



#============================= API chức năng =============================
# 1. API Xác nhận mật khẩu (Trước khi cho phép update profile)
@router.post("/verify-password")
def verify_current_password(
    req: schemas.VerifyPasswordRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Frontend gọi API này, gửi mật khẩu hiện tại lên.
    Nếu đúng -> Trả về OK (Frontend sẽ chuyển sang màn hình Update).
    Nếu sai -> Báo lỗi.
    """
    if not check_password(req.password, current_user.password):
        raise HTTPException(status_code=400, detail="Mật khẩu không chính xác!")
    
    return {"message": "Xác thực thành công. Bạn có thể cập nhật thông tin."}


# 2. API Quên mật khẩu (Reset Password)
@router.post("/forgot_password")
def forgot_password(
    req: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks, # Dùng để gửi mail ngầm
    db: Session = Depends(db_connection.get_db)
):
    """
    1. Tìm user theo email.
    2. Random mật khẩu mới.
    3. Lưu mật khẩu mới (đã hash) vào DB.
    4. Gửi mật khẩu dạng text về email user.
    """
    # 1. Tìm user
    user = crud_user.get_user_by_email(db, req.email)
    if not user:
        # Để bảo mật, dù không tìm thấy email cũng nên báo thành công giả 
        # hoặc báo lỗi tùy bạn. Ở đây mình báo lỗi cho dễ test.
        raise HTTPException(status_code=404, detail="Email không tồn tại trong hệ thống.")

    # 2. Tạo mật khẩu mới
    new_raw_password = generate_random_password(8) # Ví dụ: aX9d2LmP
    
    # 3. Lưu vào DB (Nhớ Hash nhé!)
    user.password = get_password_hash(new_raw_password)
    db.commit()
    
    # 4. Soạn nội dung mail
    subject = "Habit Tracker - Cấp lại mật khẩu mới"
    body = f"""
    Xin chào {user.full_name},
    
    Mật khẩu của bạn đã được reset thành công.
    Mật khẩu mới của bạn là: {new_raw_password}
    
    Vui lòng đăng nhập và đổi lại mật khẩu ngay nhé!
    """
    
    # 5. Đẩy việc gửi mail vào background (để API trả về nhanh)
    background_tasks.add_task(send_email_background, user.email, subject, body)

    return {"message": "Mật khẩu mới đã được gửi vào email của bạn. Vui lòng kiểm tra!"}