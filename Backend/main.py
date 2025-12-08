from fastapi import FastAPI
from database import engine, Base


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