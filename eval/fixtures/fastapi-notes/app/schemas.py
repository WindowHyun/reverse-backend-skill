from pydantic import BaseModel


class NoteIn(BaseModel):
    title: str
    body: str | None = None


class NoteOut(BaseModel):
    id: int
    title: str
    body: str | None = None
    owner_id: int

    class Config:
        from_attributes = True


class UserIn(BaseModel):
    email: str
    password: str
    is_admin: bool = False
