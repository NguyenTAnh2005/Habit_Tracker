from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.database.crud import crud_category
from app.database import db_connection
from app.schemas import schemas
from typing import List
from app.core.dependencies import get_current_user, get_admin_user
from app.database import models

# Tạo router cho category
router = APIRouter(
    prefix = "/categories",
    tags = ["Category"]
)

# API tạo Category mới
@router.post("/create", response_model = schemas.HabitCategoryResponse)
def create_category(
    category: schemas.HabitCategoryCreate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
    ):
    return crud_category.create_category(db = db, category = category)


# API Xem danh sách Category
@router.get("/", response_model=List[schemas.HabitCategoryResponse])
def read_all_categories(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    list_categories = crud_category.get_categories(db = db, skip = skip, limit = limit )
    return list_categories


# API Xem chi tiet Category
@router.get("/{category_id}",response_model = schemas.HabitCategoryResponse)
def read_category(category_id: int, db: Session = Depends(db_connection.get_db)):
    category = crud_category.get_category(db = db, category_id = category_id)
    if category is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy danh mục thói quen!")
    return category

# API Cập nhật Category
@router.put("/{category_id}")
def update_category(
    category_id: int, 
    category_update: schemas.HabitCategoryUpdate, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
    ):
    updated_category = crud_category.update_category(db = db, category_id = category_id, category_update = category_update)
    if updated_category is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy danh mục thói quen để sửa")
    return {
        "message": f"Cập nhật danh mục thói quen có id {category_id} thành công!",
        "category": jsonable_encoder(updated_category)}


# API Xóa Category
@router.delete("/{category_id}")
def delete_category(
    category_id: int, 
    db: Session = Depends(db_connection.get_db),
    current_user: models.User = Depends(get_admin_user)
    ):
    delete_category = crud_category.get_category(db = db, category_id = category_id)
    if delete_category is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy danh mục thói quen để xóa")
    list_habits = db.query(models.Habit).filter(models.Habit.category_id == category_id).all()
    
    if len(list_habits) > 0:
        raise HTTPException(
            status_code = 400, 
            detail = "Không thể xóa danh mục thói quen này vì vẫn còn thói quen thuộc danh mục!"
        )
    # Thực hiện xóa
    deleted_category = crud_category.delete_category(db = db, category_id = category_id)

    return {
        "message": f"Xóa danh mục thói quen có id {category_id} thành công!",
        "category": jsonable_encoder(deleted_category)
    } 