"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database.connection import get_db
from database.models_cmms import User, Role
from api.auth import verify_password, create_access_token, get_password_hash
from api.schemas import LoginRequest, TokenResponse, RegisterRequest, RegisterResponse
from config.app_config import config

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    Accepts username (or email) and password
    Returns JWT access token
    """
    # Try to find user by username (as per spec, only username is accepted)
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # If not found by username, try email (for backward compatibility)
    if not user:
        user = db.query(User).filter(User.email == login_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Get role name
    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "USER"
    
    # Create access token
    access_token_expires = timedelta(minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        username=user.username or user.email or "",
        role_name=role_name
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    """
    User logout endpoint (optional)
    In a stateless JWT system, logout is typically handled client-side
    """
    return None


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    User registration endpoint (optional)
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == register_data.email) | (User.username == register_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )
    
    # Get role
    role = db.query(Role).filter(Role.name == register_data.role.upper()).first()
    if not role:
        # Default to USER role if not found
        role = db.query(Role).filter(Role.name == "USER").first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default role not found"
            )
    
    # Create new user
    password_hash = get_password_hash(register_data.password)
    new_user = User(
        username=register_data.email.split("@")[0],  # Use email prefix as username
        email=register_data.email,
        password_hash=password_hash,
        role_id=role.id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return RegisterResponse(user_id=new_user.id)

