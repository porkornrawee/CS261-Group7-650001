# CORE-01 Notifications Implementation Plan

> **For agentic workers:** Implement inline in this session, using the existing Flask, SQLite, unittest, and Vanilla JS stack.

**Goal:** Add the CORE-01 schema and session auth foundation needed for per-student history and notifications, then expose authenticated notification list/read endpoints.

**Architecture:** `db.init_db()` performs idempotent migrations, creates the minimal missing `students` identity table, and recreates the overlap trigger to ignore cancelled reservations. `auth.login_required` reads the signed Flask session, sets `g.student_id`, and protects `/api/me/*`; notification endpoints lazily generate due notices then read/update only rows owned by that student.

**Tech Stack:** Flask sessions, SQLite, Python unittest; existing frontend notification API and polling.

**Spec:** `Downloads/README (1).md` CORE-01 and `Downloads/DEV4.md` US4; `backend-python/README.md` API contract.

## Global Constraints

- Session missing → 401 `UNAUTHORIZED`; access to another student's object → 403 `FORBIDDEN`.
- Reservation statuses: `active | checked_in | completed | cancelled | auto_cancelled`.
- Notification types: `near_start | near_expiry | cancelled | auto_cancelled | zone_full`.
- Notification duplicate key: `(reservation_id, type)`.
- Existing reservations and DB initialization must remain safe across repeated `init_db()` calls.

## Review Focus

- Legacy database migration: columns and trigger are installed on an existing DB without replacing reservation data; covered by migration/idempotency tests.
- Forged student selector: history and notifications ignore `student_id` query parameters; covered by cross-student tests.
- Read ownership: notification IDs owned by another student return 403 and remain unread; covered by API tests.
- Lazy generation: repeated GET does not duplicate notices and returns only the current student’s rows; covered by API tests.
- Missing session secret/session: protected endpoints return the agreed 401 shape; covered by API tests.

### Task 1: CORE-01 SQLite migration

**Files:** `backend-python/db.py`, `backend-python/config.py`, migration tests.

- [ ] Test idempotent install of `students`, reservation ownership/status timestamps, notifications table/unique key, and updated cancelled-row overlap trigger.
- [ ] Add `CANCEL_DEADLINE_MIN`, `NOTIFY_BEFORE_MIN`, `NO_SHOW_GRACE_MIN` and idempotent column/table/index/trigger setup.
- [ ] Verify migration tests and existing DB behavior.

### Task 2: Session auth foundation

**Files:** create `backend-python/auth.py`; modify `backend-python/app.py`; auth tests.

- [ ] Test missing session returns 401 and valid session sets `g.student_id` for protected routes.
- [ ] Implement `@login_required` with signed Flask sessions; configure `SECRET_KEY` from `FLASK_SECRET_KEY`. Login issuance remains US11.
- [ ] Apply the decorator to `/api/me/reservations` and notification endpoints; keep owner checks explicit for read operations.

### Task 3: Notifications API

**Files:** `backend-python/app.py`, `backend-python/notification_service.py`, `backend-python/README.md`; notification API tests.

- [ ] Test lazy generation, current-student listing, idempotent mark-read, 401, 403, and 404.
- [ ] Implement `GET /api/me/notifications` and `POST /api/me/notifications/<id>/read` using exact response/error envelopes.
- [ ] Document request/response/status codes and run backend/frontend suites.
