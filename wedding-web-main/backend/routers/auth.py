import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from lib.db import db
from models.auth import AuthMessage, OwnerLoginRequest, OwnerSession, PasswordResetRequest

router = APIRouter(prefix="/auth")

COOKIE_NAME = "mangal_owner_session"
SESSION_DAYS = 7


def _owner_email() -> str:
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    if not email:
        raise HTTPException(status_code=503, detail="Owner login is not configured")
    return email


def _firebase_api_key() -> str:
    key = os.environ.get("FIREBASE_WEB_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=503, detail="Owner login is not configured")
    return key


def _hash_session(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _secure_cookie(request: Request) -> bool:
    forwarded = request.headers.get("x-forwarded-proto", "").split(",")[0].strip()
    return request.url.scheme == "https" or forwarded == "https"


async def require_owner(
    session_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> OwnerSession:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner login required")
    session = await db.admin_sessions.find_one(
        {"session_hash": _hash_session(session_token)}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner login required")
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc) or session["email"].lower() != _owner_email():
        await db.admin_sessions.delete_one({"session_hash": _hash_session(session_token)})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner login required")
    return OwnerSession(email=session["email"], authenticated=True)


@router.post("/login", response_model=OwnerSession)
async def owner_login(payload: OwnerLoginRequest, request: Request, response: Response):
    email = payload.email.lower()
    if email != _owner_email():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    endpoint = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={_firebase_api_key()}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            firebase_response = await client.post(
                endpoint,
                json={"email": email, "password": payload.password, "returnSecureToken": True},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Login service is temporarily unavailable") from exc

    if firebase_response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    identity = firebase_response.json()
    verified_email = str(identity.get("email", "")).lower()
    if verified_email != _owner_email():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not authorized")

    raw_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=SESSION_DAYS)
    await db.admin_sessions.delete_many({"email": email})
    await db.admin_sessions.insert_one({
        "id": str(uuid4()),
        "session_hash": _hash_session(raw_token),
        "email": email,
        "firebase_uid": identity.get("localId", ""),
        "created_at": now,
        "expires_at": expires_at,
    })
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        expires=expires_at,
        path="/",
        secure=_secure_cookie(request),
        httponly=True,
        samesite="strict",
    )
    return OwnerSession(email=email, authenticated=True)


@router.get("/me", response_model=OwnerSession)
async def owner_me(session_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    if not session_token:
        return OwnerSession()
    try:
        return await require_owner(session_token)
    except HTTPException:
        return OwnerSession()


@router.post("/logout", response_model=AuthMessage)
async def owner_logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
):
    if session_token:
        await db.admin_sessions.delete_one({"session_hash": _hash_session(session_token)})
    response.delete_cookie(COOKIE_NAME, path="/", samesite="strict")
    return AuthMessage(message="Signed out")


@router.post("/password-reset", response_model=AuthMessage)
async def password_reset(payload: PasswordResetRequest):
    email = payload.email.lower()
    if email == _owner_email():
        endpoint = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={_firebase_api_key()}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                await client.post(endpoint, json={"requestType": "PASSWORD_RESET", "email": email})
        except httpx.HTTPError:
            pass
    return AuthMessage(message="If this is the owner account, Firebase has sent a password reset email.")