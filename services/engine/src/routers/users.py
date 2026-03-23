from fastapi import APIRouter, HTTPException
from src.models.schemas import UserProfile
from src.models.users import get_user, get_all_users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserProfile])
def list_users():
    return get_all_users()


@router.get("/{user_id}", response_model=UserProfile)
def get_user_by_id(user_id: str):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    return user
