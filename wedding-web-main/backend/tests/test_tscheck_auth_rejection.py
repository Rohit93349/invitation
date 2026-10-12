"""Non-owner email rejection and generic error message on /api/auth/login."""

import uuid


def test_non_owner_login_rejected_generic(client):
    bogus_email = f"tscheck-nonowner-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post("/auth/login", json={"email": bogus_email, "password": "whatever123"})
    assert resp.status_code == 401
    body = resp.json()
    assert "detail" in body
    # Must not reveal account existence or leak any owner-specific detail
    assert "exist" not in body["detail"].lower()


def test_clean_signed_out_me(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body["authenticated"] is False
    assert body.get("email") in (None, "")
