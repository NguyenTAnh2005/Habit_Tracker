from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
# Đọc chuỗi kết nối từ biến môi trường
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Tạo engine kết nối đến cơ sở dữ liệu PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo sessionmaker để tạo các phiên làm việc với cơ sở dữ liệu
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tạo lớp cơ sở cho các mô hình ORM
Base = declarative_base()

# Dependency để lấy phiên làm việc với cơ sở dữ liệu
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()