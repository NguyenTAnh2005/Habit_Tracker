from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

# Tạo Motivation Quote mới
def create_motivation_quote(db: Session, quote: schemas.MotivationQuoteCreate):
    # Dùng model_dump() để map dữ liệu từ schema sang model
    db_quote = models.MotivationQuote(
        **quote.model_dump()
        )

    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)

    return db_quote


# Lấy tất cả Motivation Quotes
def get_all_motivation_quotes(db: Session):
    return db.query(models.MotivationQuote).order_by(models.MotivationQuote.id).all()


# Lấy Motivation Quote theo ID
def get_motivation_quote_by_id(db: Session, quote_id: int):
    return db.query(models.MotivationQuote).filter(models.MotivationQuote.id == quote_id).first()


# Cập nhật Motivation Quote theo ID
def update_motivation_quote(db: Session, quote_id: int, quote_update: schemas.MotivationQuoteUpdate):
    db_quote = db.query(models.MotivationQuote).filter(models.MotivationQuote.id == quote_id).first()

    if not db_quote:
        return None
    
    update_data = quote_update.model_dump(exclude_unset = True)
    for key, value in update_data.items():
        setattr(db_quote, key, value)
        
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)

    return db_quote

# Xoá Motivation Quote theo ID
def delete_motivation_quote(db: Session, quote_id: int):
    db_quote = db.query(models.MotivationQuote).filter(models.MotivationQuote.id == quote_id).first()
    if db_quote:
        db.delete(db_quote)
        db.commit()
    return db_quote



