from fastapi import FastAPI
from app.database import models, db_connection
from app.schemas import schemas
from app.database.db_connection import engine


app = FastAPI()

@app.get("/")
def read_root():
    return {"Mesage": "Welcome to the Habit Tracker API, chạy oke rồi nè!"}

try:
    with engine.connect() as connection:
        print(" Kết nối thành công den database PostgreSQL!")
except Exception as e:
    print(" Kết nối thất bại den database PostgreSQL.")
    print(" Lỗi:", e)