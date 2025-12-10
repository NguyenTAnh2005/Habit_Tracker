from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Float
# Import ARRAY từ dialect của Postgres để đảm bảo tương thích tốt nhất
from sqlalchemy.dialects.postgresql import ARRAY 
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db_connection import Base

# --- BẢNG ROLE ---
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    desc = Column(String, nullable=True)

    users = relationship("User", back_populates="role")

# --- BẢNG USER ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="users")
    # Cascade: Xóa User -> Xóa sạch Token và Habit liên quan
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("UserTokens", back_populates="user", cascade="all, delete-orphan")

# --- BẢNG TOKEN ---
class UserTokens(Base):
    __tablename__ = "user_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="tokens")

# --- BẢNG HABIT CATEGORY ---
class HabitCategory(Base):
    __tablename__ = "habit_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    desc = Column(String, nullable=True)

    habits = relationship("Habit", back_populates="category")

# --- BẢNG HABIT ---
class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("habit_categories.id"), nullable=False)
    
    name = Column(String, nullable=False)
    desc = Column(String, nullable=True)
    
    # Mảng số nguyên lưu thứ trong tuần (0=Mon, 6=Sun) hoặc (2=Mon, 8=Sun tùy quy ước)
    frequency = Column(ARRAY(Integer), nullable=False)  
    
    unit = Column(String, nullable=True)         # VD: km, trang, ly
    target_value = Column(Float, nullable=True)  # VD: 5.0, 10.5
    color = Column(String, nullable=True)        # VD: #FF5733
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="habits")
    category = relationship("HabitCategory", back_populates="habits")
    # Cascade: Xóa Habit -> Xóa sạch Log của Habit đó
    habit_logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

# --- BẢNG HABIT LOG ---
class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    
    value = Column(Float, nullable=True)         # Kết quả thực tế
    status = Column(String, nullable=False)      # COMPLETED, SKIPPED, FAILED
    record_date = Column(Date, nullable=False)   # Ngày logic (trên lịch)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Ngày thực tế (audit)

    habit = relationship("Habit", back_populates="habit_logs")

# --- BẢNG MOTIVATIONAL QUOTE (Đã sửa tên Class) ---
class MotivationalQuote(Base):
    __tablename__ = "motivational_quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote = Column(String, nullable=False)
    author = Column(String, nullable=True)