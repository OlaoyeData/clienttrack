from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.services.llm import generate_task_breakdown
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["projects"])


def _progress_percent(project: models.Project) -> int:
    if not project.tasks:
        return 0
    done = sum(1 for t in project.tasks if t.status == models.TaskStatus.done)
    return round(done / len(project.tasks) * 100)


def _get_owned_project(project_id: str, user: models.User, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.owner_id == user.id)
        .first()
    )
    if not project:
        # 404, not 403 — don't reveal whether the id exists for another owner.
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = models.Project(
        owner_id=user.id,
        client_name=payload.client_name,
        client_email=payload.client_email,
        title=payload.title,
        project_type=payload.project_type,
        description=payload.description,
        num_pages=payload.num_pages,
        duration_weeks=payload.duration_weeks,
        duration_days=payload.duration_days,
    )
    db.add(project)
    db.flush()  # get project.id without committing yet

    breakdown = generate_task_breakdown(
        title=payload.title,
        project_type=payload.project_type.value,
        description=payload.description,
        num_pages=payload.num_pages,
        duration_weeks=payload.duration_weeks,
        duration_days=payload.duration_days,
    )

    for week in breakdown.get("weeks", []):
        week_number = week.get("week_number")
        for idx, task in enumerate(week.get("tasks", [])):
            db.add(models.Task(
                project_id=project.id,
                week_number=week_number,
                order_in_week=idx,
                title=task.get("title", "Untitled task")[:255],
                description=task.get("description"),
            ))

    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[schemas.ProjectListOut])
def list_projects(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    projects = (
        db.query(models.Project)
        .filter(models.Project.owner_id == user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )
    out = []
    for p in projects:
        item = schemas.ProjectListOut.model_validate(p)
        item.progress_percent = _progress_percent(p)
        out.append(item)
    return out


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return _get_owned_project(project_id, user, db)


@router.patch("/{project_id}/status", response_model=schemas.ProjectOut)
def update_project_status(
    project_id: str,
    payload: schemas.ProjectStatusUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = _get_owned_project(project_id, user, db)
    project.status = payload.status
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task_status(
    project_id: str,
    task_id: str,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = _get_owned_project(project_id, user, db)
    task = next((t for t in project.tasks if t.id == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    from datetime import datetime
    task.status = payload.status
    task.completed_at = datetime.utcnow() if payload.status == models.TaskStatus.done else None
    if payload.evidence_url is not None:
        task.evidence_url = payload.evidence_url.strip() or None
    db.commit()
    db.refresh(task)
    return task


@router.post("/{project_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def add_task(
    project_id: str,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = _get_owned_project(project_id, user, db)
    order = sum(1 for t in project.tasks if t.week_number == payload.week_number)
    task = models.Task(
        project_id=project.id,
        week_number=payload.week_number,
        order_in_week=order,
        title=payload.title,
        description=payload.description,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{project_id}/rotate-share-link", response_model=schemas.ProjectOut)
def rotate_share_link(project_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Invalidate the old client link and issue a new one (e.g. if it leaked)."""
    project = _get_owned_project(project_id, user, db)
    project.share_token = models.gen_share_token()
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/share-enabled", response_model=schemas.ProjectOut)
def toggle_share(project_id: str, enabled: bool, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = _get_owned_project(project_id, user, db)
    project.share_enabled = enabled
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = _get_owned_project(project_id, user, db)
    db.delete(project)
    db.commit()
