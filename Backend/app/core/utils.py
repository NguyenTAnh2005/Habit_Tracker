from passlib.context import CryptContext

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
