import os

from fastapi import APIRouter, Depends

from app.db import get_db
from app.deps import require_admin
from app.models import Note

router = APIRouter()


@router.post("/purge", dependencies=[Depends(require_admin)])
def purge(db=Depends(get_db)):
    db.query(Note).delete()
    db.commit()
    return {"purged": True}


@router.get("/debug")
def debug():
    return {"env": dict(os.environ), "database_url": os.environ.get("DATABASE_URL")}
