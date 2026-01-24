from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Cấu hình các biến môi trường
    # Pydantic sẽ tự động tìm biến có tên tương ứng trong file .env hoặc biến hệ thống (OS Environment)
    
    # Giá trị sau dấu = là GIÁ TRỊ MẶC ĐỊNH (dùng khi không tìm thấy biến môi trường)
    # Khi deploy, bạn chỉ cần set biến môi trường trên server là nó tự nhận, không cần sửa code.
    
    FRONTEND_URL: str 
    
    # Lưu ý: Đây là DB local, khi deploy nhớ set biến DATABASE_URL trên server trỏ về DB thật
    DATABASE_URL: str = "postgresql://postgres:ntaPGSQL2005@localhost/habit_tracker_db"
    
    SECRET_KEY: str 

    MAIL_USERNAME: str = "23050118@student.bdu.edu.vn"
    MAIL_PASSWORD: str 
    MAIL_FROM: str = "23050118@student.bdu.edu.vn"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"


    # 60 phút * 24 giờ * 14 ngày = 20160 phút
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20160

    # 
    #RECOVERY_KEY_ADMIN: str

    

    class Config:
        # Chỉ định file chứa biến môi trường (dành cho môi trường Dev Local)
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Bỏ qua các biến thừa trong file .env để không báo lỗi
        extra = "ignore" 
        # Phân biệt chữ hoa/thường (thường Env var viết hoa hết)
        case_sensitive = True

settings = Settings()
