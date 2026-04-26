"""Authentication Pydantic schemas.

Request and response models for user registration, login, and profile.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreateRequest(BaseModel):
    """Request body for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    """Request body for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user profile response."""

    id: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response (used internally; cookie is preferred)."""

    access_token: str
    token_type: str = "bearer"
