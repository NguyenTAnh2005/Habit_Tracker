from fastapi import APIRouter, Depends, HTTPException, status
# Import cái Form chuẩn của FastAPI
from fastapi.security import OAuth2PasswordRequestForm 
from sqlalchemy.orm import Session
from app.database import db_connection, models
from app.core.utils import check_password, create_access_token 
from app.schemas import schemas
from datetime import timedelta

router = APIRouter(tags=["Authentication"])

# API Đăng nhập (Quay lại dùng Form Data để khớp với Swagger)
@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    # 👇 Thay đổi: Dùng form_data thay vì schemas.UserLogin
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(db_connection.get_db)
):
    # 1. form_data sẽ có 2 trường: username và password
    # Vì hệ thống mình dùng Email đăng nhập, nên ta lấy form_data.username đem so với cột Email trong DB
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Kiểm tra
    if not user or not check_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Tạo Token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }