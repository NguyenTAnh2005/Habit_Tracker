from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from enum import Enum

#=============SCHEMA CHO BẢNG ROLE - admin dùng để phân quyền
class RoleBase(BaseModel):
    name: str
    desc: Optional[str] = None # Không bắt buộc (mặc định là None)

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True


#=============SCHEMA CHO BẢNG USER
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str

# Người dùng đăng ký (ko cho chọn quyền)
class UserRegister(UserBase):
    password: str 

# Admin tạo => cho phép chọn quyền 
class UserCreatedByAdmin(UserBase):
    password: str
    role_id: int

# RESPONSE: Dùng để Server trả về thông tin (Profile)
class UserResponse(BaseModel):
    id: int              # Muốn hiện ID
    username: str        # Muốn hiện username
    email: str           # Muốn hiện email
    full_name: str       # Muốn hiện tên đầy đủ
    role_id: int

    # Cấu hình để Pydantic đọc được dữ liệu từ SQLAlchemy (Object)
    class Config:
        from_attributes = True
     
#===============SCHEMA CHO BẢNG HABIT CATEGORY
class HabitCategoryBase(BaseModel):
    name: str
    desc: Optional[str] = None

class HabitCategoryCreate(HabitCategoryBase):
    pass

class HabitCategoryResponse(HabitCategoryBase):
    id: int
    class Config:
        from_attributes = True

class HabitCategoryUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None

#====================SCHEMA CHO BẢNG HABIT
class HabitBase(BaseModel):
    category_id: int
    name: str
    desc: Optional[str] = None
    frequency: List[int]  # Mảng số nguyên lưu thứ trong tuần
    unit: Optional[str] = None         # VD: km, trang, ly
    target_value: Optional[float] = None  # VD: 1,2,3
    color: Optional[str] = None        # VD: #FF5733
    
class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    desc: Optional[str] = None
    frequency: Optional[List[int]] = None
    unit: Optional[str] = None
    target_value: Optional[float] = None
    color: Optional[str] = None

class HabitResponse(HabitBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

#===============---- Định nghĩa Enum cho trạng thái HabitLog
class HabitLogStatus(str, Enum):
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

#================== SHEMA CHO BẢNG HABIT LOG
class HabitLogBase(BaseModel):
    habit_id: int
    record_date: date
    status: HabitLogStatus
    value: Optional[float] = None 

class HabitLogCreate(HabitLogBase):
    pass

class HabitLogUpdate(BaseModel):
    habit_id: Optional[int] = None
    record_date: Optional[date] = None
    status: Optional[HabitLogStatus] = None
    value: Optional[float] = None

class HabitLogResponse(HabitLogBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Schema cho User xem list log của mình (Kèm tên Habit)
class HabitLogUserResponse(HabitLogResponse): 
    habit_name: str # Thêm trường này để hiển thị tên thói quen

    class Config:
        from_attributes = True

# Schema HabitLog chi tiết cho Admin (hiển thị thêm tên habit và tên user)
class HabitLogAdminResponse(BaseModel):
    id: int
    record_date: date
    status: HabitLogStatus
    value: Optional[float] = None
    
    habit_name: str       
    user_full_name: str   

    class Config:
        from_attributes = True

# ====================== SCHEMA CHO BẢNG MOTIVATION_QUOTE
class MotivationQuoteBase(BaseModel):
    quote: str
    author: Optional[str] = None

class MotivationQuoteCreate(MotivationQuoteBase):
    pass

class MotivationQuoteUpdate(BaseModel):
    quote: Optional[str] = None
    author: Optional[str] = None

class MotivationQuoteResponse(MotivationQuoteBase):
    id: int
    class Config:
        from_attributes = True


#=============================== SCHEMA CHO BẢNG TOKEN
# Schema này dùng để trả về cho Frontend ngay sau khi Login thành công
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema này dùng để giải mã token (khi frontend gửi token lên để lấy dữ liệu)
class TokenData(BaseModel):
    user_id: Optional[int] = None