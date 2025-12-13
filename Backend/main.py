from fastapi import FastAPI
from app.routers import habits
from app.database import models, db_connection
from app.schemas import schemas
from app.database.db_connection import engine
from app.routers import users, roles, categories, habits, habit_logs, motivation_quotes # import router con để đăng ký vào app chính



app = FastAPI()
# bỏ router con vào app chính
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(habits.router)
app.include_router(habit_logs.router)
app.include_router(motivation_quotes.router)


@app.get("/")
def read_root():
    return {"Mesage": "Welcome to the Habit Tracker API, chạy oke rồi nè!"}

