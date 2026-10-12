"""API coverage for the public guest RSVP flow criterion.

Guests must still be able to submit an RSVP without any owner session
(POST /api/rsvps remains intentionally unauthenticated), while the admin-only
listing used to verify the row stays behind owner auth (covered separately by
test_tscheck_admin_guest_protection.py). This test does NOT rely on the admin
endpoint, since guests never have a session.
"""

import uuid


def _unique_name() -> str:
    return f"tscheck-rsvp-{uuid.uuid4().hex[:8]}"


def test_rsvp_submit_happy_path_unauthenticated(client):
    guest_name = _unique_name()
    payload = {"guest_name": guest_name, "guest_count": 3}

    resp = client.post("/rsvps", json=payload)
    assert resp.status_code in (200, 201), f"POST /api/rsvps -> {resp.status_code}: {resp.text[:300]}"
    body = resp.json()
    assert body.get("guest_name") == guest_name
    assert body.get("guest_count") == 3
    assert body.get("id")

    # The same unauthenticated client must NOT be able to read it back via the
    # owner-only listing -- guests get no visibility into other RSVPs either.
    list_resp = client.get("/admin/rsvps")
    assert list_resp.status_code == 401, (
        f"GET /api/admin/rsvps should stay owner-only, got {list_resp.status_code}: {list_resp.text[:300]}"
    )


def test_rsvp_rejects_missing_guest_name(client):
    resp = client.post("/rsvps", json={"guest_count": 2})
    assert resp.status_code in (400, 422), (
        f"Expected validation failure for missing guest_name, got {resp.status_code}: {resp.text[:300]}"
    )
