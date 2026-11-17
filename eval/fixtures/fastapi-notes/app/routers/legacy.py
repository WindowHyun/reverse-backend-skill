from fastapi import APIRouter, Depends

from app.db import get_db
from app.deps import require_admin
from app.models import Note

router = APIRouter()


# @router.delete("/notes/{note_id}", dependencies=[Depends(require_admin)])
# def delete_note_admin(note_id: int, db=Depends(get_db)):
#     db.query(Note).filter(Note.id == note_id).delete()
#     db.commit()
@router.delete("/notes/{note_id}")
def delete_note_legacy(note_id: int, db=Depends(get_db)):
    db.query(Note).filter(Note.id == note_id).delete()
    db.commit()
    return {"deleted": note_id}
