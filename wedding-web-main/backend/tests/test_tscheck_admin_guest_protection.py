"""Guest (no session) protection for /api/admin/* read and write routes."""


def test_guest_cannot_read_rsvps(client):
    resp = client.get("/admin/rsvps")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Owner login required"


def test_guest_cannot_read_versions(client):
    resp = client.get("/admin/invitation/versions")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Owner login required"


def test_guest_cannot_read_rsvp_csv(client):
    resp = client.get("/admin/rsvps.csv")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Owner login required"


def test_guest_cannot_publish_invitation(client):
    before = client.get("/invitation")
    assert before.status_code == 200
    before_label = before.json()["basics"]["celebration_label_en"]

    tampered = before.json()
    tampered["basics"]["celebration_label_en"] = "tscheck-guest-hack-should-not-apply"
    resp = client.put("/admin/invitation", json=tampered)
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Owner login required"

    after = client.get("/invitation")
    assert after.json()["basics"]["celebration_label_en"] == before_label


def test_guest_cannot_restore_version(client):
    resp = client.post("/admin/invitation/restore", json={"version_id": "tscheck-fake-id"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Owner login required"
