from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import decode_access_token
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not token:
        raise CREDENTIALS_EXCEPTION
    user_id = decode_access_token(token)
    if not user_id:
        raise CREDENTIALS_EXCEPTION
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise CREDENTIALS_EXCEPTION
    return user
