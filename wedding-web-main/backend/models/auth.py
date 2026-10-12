from pydantic import BaseModel, EmailStr, Field


class OwnerLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=256)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class OwnerSession(BaseModel):
    email: EmailStr | None = None
    authenticated: bool = False


class AuthMessage(BaseModel):
    message: str