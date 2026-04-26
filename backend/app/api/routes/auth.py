"""Authentication REST endpoints.

Provides user registration, login (via httpOnly cookie), logout, and
profile retrieval.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, UserCreateRequest, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

# Cookie settings
COOKIE_NAME = "access_token"
COOKIE_MAX_AGE_DAYS = 7


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set the httpOnly JWT cookie on the response."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,  # local dev; set True in production behind HTTPS
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie."""
    response.delete_cookie(key=COOKIE_NAME)


@router.post("/auth/register", status_code=201, response_model=UserResponse)
async def register(
    request: UserCreateRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user account.

    Returns 409 Conflict if the email is already registered.
    """
    # Check for existing email
    result = await db.execute(select(User).where(User.email == request.email))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-login after registration
    token = create_access_token({"sub": user.id})
    _set_auth_cookie(response, token)

    logger.info("Registered new user: %s", user.email)
    return UserResponse.model_validate(user)


@router.post("/auth/login", response_model=UserResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Authenticate a user and set an httpOnly JWT cookie.

    Returns 401 Unauthorized on invalid credentials.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": user.id})
    _set_auth_cookie(response, token)

    logger.info("User logged in: %s", user.email)
    return UserResponse.model_validate(user)


@router.post("/auth/logout", status_code=204)
async def logout(response: Response) -> None:
    """Clear the auth cookie and log out."""
    _clear_auth_cookie(response)


@router.get("/auth/me", response_model=UserResponse)
async def me(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get the currently authenticated user's profile.

    Returns 401 if the token cookie is missing or invalid.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return UserResponse.model_validate(user)
