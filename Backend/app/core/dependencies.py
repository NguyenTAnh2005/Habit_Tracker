from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import db_connection, models
from app.schemas import schemas

# 👇 SỬA Ở ĐÂY: Import settings từ config thay vì lấy lẻ tẻ từ utils
from app.core.config import settings 

# Định nghĩa nơi lấy token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Hàm Dependency: Lấy user hiện tại từ Token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(db_connection.get_db)):
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực người dùng",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Giải mã Token
        # 👇 SỬA Ở ĐÂY: Dùng settings.SECRET_KEY
        # Algorithm thường mặc định là HS256, bạn có thể hardcode luôn hoặc thêm vào settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # 2. Lấy User ID (sub) từ trong token
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        token_data = schemas.TokenData(user_id=int(user_id))
        
    except JWTError:
        raise credentials_exception
    
    # 3. Tìm User trong Database
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    return user


ADMIN_ROLE_ID = 1 
# Hàm Dependency: Chỉ cho phép Admin đi qua
def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role_id != ADMIN_ROLE_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền truy cập (Admin only)!"
        )
    return current_user