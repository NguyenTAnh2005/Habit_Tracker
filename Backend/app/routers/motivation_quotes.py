from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.crud import crud_motivation_quote
from app.database import db_connection
from app.schemas import schemas
from typing import List


# Tạo router cho motivation quotes
router = APIRouter(
    prefix = "/motivation-quotes",
    tags = ["Motivation Quote"]
)


# API tạo Motivation Quote mới
@router.post("/create", response_model = schemas.MotivationQuoteResponse)
def create_motivation_quote(quote: schemas.MotivationQuoteCreate, db: Session = Depends(db_connection.get_db)):
    '''
    Tạo Motivation Quote mới
    '''
    return crud_motivation_quote.create_motivation_quote(db = db, quote = quote)


# API Xem danh sách tất cả Motivation Quotes
@router.get("/", response_model = List[schemas.MotivationQuoteResponse])
def read_all_motivation_quotes(db: Session = Depends(db_connection.get_db)):
    '''
    Xem tất cả các Motivation Quotes
    '''
    list_quotes = crud_motivation_quote.get_all_motivation_quotes(db=db)
    return list_quotes


# API Xem chi tiết Motivation Quote theo ID
@router.get("/{quote_id}",response_model = schemas.MotivationQuoteResponse)
def read_motivation_quote(quote_id: int, db: Session = Depends(db_connection.get_db)):
    quote = crud_motivation_quote.get_motivation_quote_by_id(db = db, quote_id = quote_id)
    if quote is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy câu nói động lực!")
    return quote


#API Cập nhật Motivation Quote theo ID
@router.put("/{quote_id}")
def update_motivation_quote(quote_id: int, quote_update: schemas.MotivationQuoteUpdate, db: Session = Depends(db_connection.get_db)):
    updated_quote = crud_motivation_quote.update_motivation_quote(db = db, quote_id = quote_id, quote_update = quote_update)
    if updated_quote is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy câu nói động lực để cập nhật!")
    return {"message": f"Cập nhật câu nói động lực thành công motivation quote có id = {quote_id}!", "quote": updated_quote}


# API Xoá Motivation Quote theo ID
@router.delete("/{quote_id}")    
def delete_motivation_quote(quote_id: int, db: Session = Depends(db_connection.get_db)):
    deleted_quote = crud_motivation_quote.delete_motivation_quote(db = db, quote_id = quote_id)
    if deleted_quote is None:
        raise HTTPException(status_code = 404, detail = "Không tìm thấy câu nói động lực để xoá!")
    return {"message": f"Xoá câu nói động lực thành công motivation quote có id = {quote_id}!", "quote": deleted_quote}