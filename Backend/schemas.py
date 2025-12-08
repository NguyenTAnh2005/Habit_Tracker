from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from enum import Enum

# SCHEMA CHO BẢNG ROLE - admin dùng để phân quyền
class RoleBase(BaseModel):
    name: str
    desc: Optional[str] = None # Không bắt buộc (mặc định là None)

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True


# SCHEMA CHO BẢNG USER
# 1. BASE: Chứa điểm chung (Tên, Email...)
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    # role_id cũng nên ở đây nếu lúc tạo và lúc xem đều cần
    # Tuy nhiên, thường user đăng ký sẽ mặc định role là Member
    # Nhưng theo Model của bạn là nullable=False, nên ta để Frontend gửi lên
    role_id: int 

# 2. CREATE: Dùng để Frontend gửi dữ liệu Đăng Ký
# Kế thừa Base + thêm Password
class UserCreate(UserBase):
    password: str 

# 3. RESPONSE: Dùng để Server trả về thông tin (Profile)
# Kế thừa Base + thêm ID, Ngày tạo
# TUYỆT ĐỐI KHÔNG CÓ PASSWORD Ở ĐÂY
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

            
# SCHEMA CHO BẢNG HABIT CATEGORY
class HabitCategoryBase(BaseModel):
    name: str
    desc: Optional[str] = None

class HabitCategoryCreate(HabitCategoryBase):
    pass

class HabitCategoryResponse(HabitCategoryBase):
    id: int
    class Config:
        from_attributes = True


# SCHEMA CHO BẢNG HABIT
class HabitBase(BaseModel):
    category_id: int
    name: str
    desc: Optional[str] = None
    frequency: List[float]  # Mảng số nguyên lưu thứ trong tuần
    unit: Optional[str] = None         # VD: km, trang, ly
    target_value: Optional[float] = None  # VD: 1,2,3
    color: Optional[str] = None        # VD: #FF5733
    
class HabitCreate(HabitBase):
    pass

class HabitResponse(HabitBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Định nghĩa Enum cho trạng thái HabitLog
class HabitLogStatus(str, Enum):
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

#SHEMA CHO BẢNG HABIT LOG
class HabitLogBase(BaseModel):
    habit_id: int
    record_date: date
    status: HabitLogStatus
    value: Optional[float] = None 

class HabitLogCreate(HabitLogBase):
    pass

class HabitLogResponse(HabitLogBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# SCHEMA CHO BẢNG MOTIVATION_QUOTE
class MotivationQuoteBase(BaseModel):
        quote: str
        author: Optional[str] = None

class MotivationQuoteCreate(MotivationQuoteBase):
    pass

class MotivationQuoteResponse(MotivationQuoteBase):
    id: int
    class Config:
        from_attributes = True


# SCHEMA CHO BẢNG TOKEN
# Schema này dùng để trả về cho Frontend ngay sau khi Login thành công
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema này dùng để giải mã token (khi frontend gửi token lên để lấy dữ liệu)
class TokenData(BaseModel):
    user_id: Optional[int] = None