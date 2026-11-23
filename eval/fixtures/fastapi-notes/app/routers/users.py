from fastapi import APIRouter, Depends

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import UserIn
from app.security import hash_password

router = APIRouter()


@router.post("/", status_code=201)
def signup(payload: UserIn, db=Depends(get_db)):
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_admin=payload.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}")
def get_user(user_id: int, db=Depends(get_db), current=Depends(get_current_user)):
    return db.get(User, user_id)
