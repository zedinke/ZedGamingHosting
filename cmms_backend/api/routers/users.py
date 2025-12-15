"""
User management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from database.models_cmms import User, Role
from api.auth import get_current_active_user
from api.schemas import UserDto, CreateUserRequest, CreateUserResponse
from api.auth import get_password_hash

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserDto)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return UserDto(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=role.name if role else None,
        created_at=current_user.created_at
    )


@router.get("", response_model=List[UserDto])
async def get_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users (ADMIN only)"""
    # Check if user is admin
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role or role.name not in ["ADMIN", "admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users = db.query(User).all()
    result = []
    for user in users:
        user_role = db.query(Role).filter(Role.id == user.role_id).first()
        result.append(UserDto(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user_role.name if user_role else None,
            created_at=user.created_at
        ))
    return result


@router.post("", response_model=CreateUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new user (ADMIN only)"""
    # Check if user is admin
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role or role.name not in ["ADMIN", "admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )
    
    # Get role
    user_role = db.query(Role).filter(Role.name == user_data.role.upper()).first()
    if not user_role:
        user_role = db.query(Role).filter(Role.name == "USER").first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default role not found"
            )
    
    # Create new user
    password_hash = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.email.split("@")[0],
        email=user_data.email,
        password_hash=password_hash,
        role_id=user_role.id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return CreateUserResponse(id=new_user.id)

