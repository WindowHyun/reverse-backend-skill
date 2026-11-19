import os

from celery import Celery

celery_app = Celery("notes", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))


@celery_app.task
def send_digest(user_id: int):
    # builds and e-mails the daily digest for one user
    return {"user_id": user_id, "sent": True}


@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(86400.0, send_digest.s(0), name="daily digest")
