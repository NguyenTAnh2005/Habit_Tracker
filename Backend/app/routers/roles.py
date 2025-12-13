from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.crud import crud_role
from app.database import db_connection, models
from app.schemas import schemas
from typing import List


# Tạo router cho role
router = APIRouter(
    prefix = "/roles",
    tags = ["Role"]
)


# API tạo Role mới
@router.post("/create", response_model = schemas.RoleResponse)
def create_role(role: schemas.RoleCreate, db: Session = Depends(db_connection.get_db)):
    '''
    Tạo Role mới
    '''
    return crud_role.create_role(db = db, role = role)


# API xem danh sách tất cả quyền
@router.get("/", response_model = List[schemas.RoleResponse])
def read_all_roles(skip: int = 0, limit: int = 100, db: Session = Depends(db_connection.get_db)):
    '''
    Xem tất cả các Role
    '''
    return crud_role.get_roles(db = db)


# API xem thông tin quyền thông qua Id
@router.get("/{role_id}", response_model = schemas.RoleResponse)
def read_role(role_id: int, db: Session = Depends(db_connection.get_db)):
    db_role = crud_role.get_role(role_id = role_id, db = db)
    if db_role is None: 
        raise HTTPException(status_code = 404, detail = "Không tìm thấy quyền (vai trò)!")
    return db_role


#API cập nhật Role
@router.put("/update/{role_id}", response_model = schemas.RoleResponse)
def update_role(
    role_id: int, 
    updated_role: schemas.RoleUpdate, 
    db: Session = Depends(db_connection.get_db)
    ):
    updated_role = crud_role.update_role(role_id = role_id, role_update = updated_role, db = db)
    if updated_role is None: 
        raise HTTPException(status_code = 404, detail = "Không tìm thấy vai trò để sửa")
    return updated_role


# API xóa Role
@router.delete("/delete/{role_id}")
def delete_role(role_id: int, db: Session = Depends(db_connection.get_db)):
    list_user_with_role = db.query(models.User).filter(models.User.role_id == role_id).all()
    if list_user_with_role:
        raise HTTPException(status_code = 400, detail = " Không thể xóa quyền (vai trò) này vì có người đang sử dụng quyền (vai trò) này!!")
    deleted_role = crud_role.delete_role(db = db, role_id = role_id)
    if deleted_role is None: 
        raise HTTPException(status_code = 404, detail = "Không tìm thấy quyền (vai trò) để xóa!")
    return {"message": f"Xóa vai trò thành công role có id = {role_id}!", "role": deleted_role}
    
