from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
from typing import Optional

# Khai báo context dùng Crypt để hash mật khẩu
# CẤU HÌNH CÁI MÁY XAY
# schemes=["bcrypt"]: Chọn loại lưỡi dao là bcrypt (rất mạnh).
# deprecated="auto": Tự động bỏ qua các thuật toán cũ nếu sau này mình update.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hàm kiểm tra trùng khớp mật khẩu
def check_password(plain_password, hashed_password):
    """
    - plain_password: Mật khẩu user nhập vào form (VD: 123456)
    - hashed_password: Chuỗi loằng ngoằng lấy từ Database ra.
    -> Hàm này tự động băm cái plain và so sánh với hashed.
    -> Trả về True (khớp) hoặc False (sai).
    """
    return pwd_context.verify(plain_password, hashed_password)

# Hàm băm mật khẩu
def get_password_hash(password):
    """
    - password: Mật khẩu thô user muốn đặt.
    -> Trả về chuỗi đã mã hóa để đem đi lưu vào DB.
    """
    return pwd_context.hash(password)


# Cấu hình cho JWT
load_dotenv()  # Load biến môi trường từ file .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Thời gian token hết hạn (30 phút)

# Hàm tạo Access Token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Nhét thời gian hết hạn vào token
    to_encode.update({"exp": expire})
    
    # Mã hóa thành chuỗi JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt