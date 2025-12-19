from fastapi import FastAPI
from app.routers import habits
from app.database import models, db_connection
from app.schemas import schemas
from app.database.db_connection import engine
from app.routers import users, roles, categories, habits, habit_logs, motivation_quotes, auth # import router con để đăng ký vào app chính
from app.database.init_db import seed_data
from fastapi.middleware.cors import CORSMiddleware

# Import settings để load biến môi trường
from app.core.config import settings

seed_data()  # Gọi hàm khởi tạo dữ liệu ban đầu


app = FastAPI()

# ==========================================
# CẤU HÌNH CORS (DÙNG BIẾN MÔI TRƯỜNG)
# ==========================================
origins = [
    settings.FRONTEND_URL, # <--- Lấy từ .env (http://localhost:5173)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Hoặc để ["*"] nếu muốn mở full (không khuyến khích khi deploy thật)
    allow_credentials=True,
    allow_methods=["*"],   # Cho phép tất cả các method: POST, GET, PUT, DELETE...
    allow_headers=["*"],   # Cho phép gửi token qua header
)

# bỏ router con vào app chính
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(habits.router)
app.include_router(habit_logs.router)
app.include_router(motivation_quotes.router)
app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"Mesage": "Welcome to the Habit Tracker API, chạy oke rồi nè!"}


