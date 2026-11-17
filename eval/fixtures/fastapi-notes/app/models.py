from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from app.db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    body = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    internal_flag = Column(String)
