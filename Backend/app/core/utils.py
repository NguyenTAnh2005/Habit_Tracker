from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from typing import Optional
from app.core.config import settings 
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import string

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


ALGORITHM = "HS256" 

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # 👇 SỬA Ở ĐÂY: Lấy tham số từ settings
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # 👇 SỬA Ở ĐÂY: Lấy SECRET_KEY từ settings
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


# Hàm tạo mật khẩu ngẫu nhiên
def generate_random_password(length=8):
    """Hàm tạo mật khẩu ngẫu nhiên gồm chữ hoa, chữ thường và số."""
    characters = string.ascii_letters + string.digits
    random_password = ''.join(random.choice(characters) for _ in range(length))
    return random_password

# Hàm gửi email
def send_email_background(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.MAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        # Kết nối Server Gmail
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls() # Bảo mật
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.MAIL_FROM, to_email, text)
        server.quit()
        print(f"Đã gửi mail thành công tới {to_email}")
    except Exception as e:
        print(f"Lỗi gửi mail: {e}")
