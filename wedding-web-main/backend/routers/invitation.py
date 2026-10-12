import csv
import io
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response

from lib.db import db
from models.auth import OwnerSession
from routers.auth import require_owner
from models.invitation import (
    BRIDE_PORTRAIT_URL,
    GALLERY_ROTATIONS,
    GROOM_PORTRAIT_URL,
    HOME_MAP_EMBED,
    HOME_MAP_LINK,
    PHOTO_URLS,
    InvitationContent,
    RestoreRequest,
    RsvpCreate,
    RsvpResponse,
    VersionSummary,
    default_invitation,
)

router = APIRouter()


async def get_or_seed_invitation() -> InvitationContent:
    doc = await db.invitation.find_one({"key": "main"}, {"_id": 0})
    if doc:
        doc.pop("key", None)
        content = InvitationContent.model_validate(doc)
        changed = False
        if content.basics.bride_en == "AAKANKSHA":
            content.basics.bride_en = "AKANKSHA"
            changed = True
        for field in ("page_title_en", "seo_description_en", "whatsapp_title_en"):
            value = getattr(content.basics, field)
            corrected = value.replace("Aakanksha", "Akanksha")
            if value != corrected:
                setattr(content.basics, field, corrected)
                changed = True
        if content.couple.bride.name_en == "Aakanksha Kumari":
            content.couple.bride.name_en = "Akanksha Kumari"
            changed = True
        if content.couple.bride.photo_url in PHOTO_URLS:
            content.couple.bride.photo_url = BRIDE_PORTRAIT_URL
            content.couple.bride.photo_rotation = -90
            content.couple.bride.photo_alt_en = "Portrait of Akanksha"
            changed = True
        if content.couple.groom.photo_url in PHOTO_URLS:
            content.couple.groom.photo_url = GROOM_PORTRAIT_URL
            content.couple.groom.photo_rotation = -90
            changed = True
        rotation_by_url = dict(zip(PHOTO_URLS, GALLERY_ROTATIONS))
        for photo in content.gallery:
            expected = rotation_by_url.get(photo.url)
            if expected is not None and photo.rotation != expected:
                photo.rotation = expected
                changed = True
            if photo.caption_en == "Aakanksha":
                photo.caption_en = "Akanksha"
                changed = True
        home = next((venue for venue in content.venues if venue.id == "home"), None)
        if home and (home.map_link != HOME_MAP_LINK or home.embed_url != HOME_MAP_EMBED):
            home.map_link = HOME_MAP_LINK
            home.embed_url = HOME_MAP_EMBED
            changed = True
        corrected_poem = content.texts.kids_poem.replace("शादी", "‘छादी’").replace(" ।", "।")
        if content.texts.kids_poem != corrected_poem:
            content.texts.kids_poem = corrected_poem
            changed = True
        if content.texts.aspirant_en != "Devendra Kumar":
            content.texts.aspirant_en = "Devendra Kumar"
            changed = True
        if changed:
            await db.invitation.replace_one({"key": "main"}, {"key": "main", **content.model_dump()}, upsert=True)
        return content
    content = default_invitation()
    await db.invitation.insert_one({"key": "main", **content.model_dump()})
    return content


@router.get("/invitation", response_model=InvitationContent)
async def get_invitation():
    return await get_or_seed_invitation()


@router.put("/admin/invitation", response_model=InvitationContent)
async def publish_invitation(content: InvitationContent, owner: OwnerSession = Depends(require_owner)):
    current = await get_or_seed_invitation()
    version_id = str(uuid4())
    await db.invitation_versions.insert_one({
        "id": version_id,
        "version": current.version,
        "created_at": datetime.now(timezone.utc),
        "content": current.model_dump(),
    })
    content.version = current.version + 1
    content.updated_at = datetime.now(timezone.utc)
    await db.invitation.replace_one(
        {"key": "main"}, {"key": "main", **content.model_dump()}, upsert=True
    )
    return content


@router.get("/admin/invitation/versions", response_model=list[VersionSummary])
async def list_versions(owner: OwnerSession = Depends(require_owner)):
    docs = await db.invitation_versions.find({}, {"_id": 0, "content": 0}).sort("created_at", -1).to_list(10)
    return [VersionSummary.model_validate(doc) for doc in docs]


@router.post("/admin/invitation/restore", response_model=InvitationContent)
async def restore_version(request: RestoreRequest, owner: OwnerSession = Depends(require_owner)):
    saved = await db.invitation_versions.find_one({"id": request.version_id}, {"_id": 0})
    if not saved:
        raise HTTPException(status_code=404, detail="Version not found")
    content = InvitationContent.model_validate(saved["content"])
    current = await get_or_seed_invitation()
    content.version = current.version + 1
    content.updated_at = datetime.now(timezone.utc)
    await db.invitation.replace_one({"key": "main"}, {"key": "main", **content.model_dump()}, upsert=True)
    return content


@router.post("/rsvps", response_model=RsvpResponse, status_code=201)
async def create_rsvp(payload: RsvpCreate):
    response = RsvpResponse(**payload.model_dump())
    await db.rsvps.insert_one(response.model_dump())
    return response


@router.get("/admin/rsvps", response_model=list[RsvpResponse])
async def list_rsvps(owner: OwnerSession = Depends(require_owner)):
    docs = await db.rsvps.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [RsvpResponse.model_validate(doc) for doc in docs]


@router.get("/admin/rsvps.csv")
async def export_rsvps(owner: OwnerSession = Depends(require_owner)):
    docs = await db.rsvps.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Guest Name", "Number of Guests", "Submitted At"])
    for doc in docs:
        writer.writerow([doc["guest_name"], doc["guest_count"], doc["created_at"].isoformat()])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rsvp-responses.csv"},
    )