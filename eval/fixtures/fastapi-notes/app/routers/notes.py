from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.deps import get_current_user
from app.models import Note
from app.schemas import NoteIn, NoteOut

router = APIRouter()


@router.get("/", response_model=list[NoteOut])
def list_notes(db=Depends(get_db), user=Depends(get_current_user)):
    return db.query(Note).filter(Note.owner_id == user.id).all()


@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/", response_model=NoteOut, status_code=201)
def create_note(payload: NoteIn, db=Depends(get_db), user=Depends(get_current_user)):
    note = Note(**payload.dict(), owner_id=user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note or note.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
