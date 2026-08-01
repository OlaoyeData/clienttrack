from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/track", tags=["public"])


@router.get("/{share_token}", response_model=schemas.PublicProjectOut)
def get_public_project(share_token: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.share_token == share_token).first()
    if not project or not project.share_enabled:
        # Same 404 whether the token is wrong or sharing was turned off —
        # don't leak which case it is.
        raise HTTPException(status_code=404, detail="This tracking link is invalid or no longer active")

    done = sum(1 for t in project.tasks if t.status == models.TaskStatus.done)
    progress = round(done / len(project.tasks) * 100) if project.tasks else 0

    return schemas.PublicProjectOut(
        title=project.title,
        project_type=project.project_type,
        description=project.description,
        status=project.status,
        duration_weeks=project.duration_weeks,
        duration_days=project.duration_days,
        owner_name=project.owner.full_name,
        progress_percent=progress,
        tasks=[schemas.PublicTaskOut.model_validate(t) for t in project.tasks],
    )
