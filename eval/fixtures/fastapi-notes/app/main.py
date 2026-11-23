from fastapi import FastAPI

from app.routers import admin, auth, legacy, notes, users

app = FastAPI(title="Notes API")

app.include_router(auth.router)
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(legacy.router, prefix="/legacy", tags=["legacy"])


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
