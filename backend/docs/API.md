# Backend API Reference

Base path: `/api`

All mutating requests require:

- `Content-Type: application/json`
- trusted `Origin` when the browser sends one
- `X-CSRF-Token` matching the `robotree_csrf` cookie from `GET /api/csrf-token`

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/csrf-token` | Issues a CSRF token cookie and response token. |
| `GET` | `/health` | Basic uptime probe. |
| `GET` | `/health/diagnostics` | Memory, uptime, session, and data metrics. |
| `GET` | `/team` | Public team directory. |
| `GET` | `/events` | Event/gallery listing. |
| `POST` | `/newsletter` | Newsletter signup. |
| `POST` | `/program-interest` | Saves lightweight program interest. |
| `POST` | `/contact` | Saves contact/lead inquiry. |
| `POST` | `/feedback` | Saves user feedback. |
| `POST` | `/analytics/event` | Stores analytics/A-B testing event. |
| `POST` | `/applications` | Saves career/application record. |

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Creates student/employee account. |
| `POST` | `/auth/login` | Issues user session token. |
| `GET` | `/auth/me` | Returns current user profile. |
| `POST` | `/auth/logout` | Revokes current user token. |
| `GET` | `/auth/export-data` | GDPR/CCPA-style data export. |
| `POST` | `/auth/delete-account` | Deletes account after password verification. |

## Administration

Admin routes require `Authorization: Bearer <adminToken>`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/admin/login` | Issues short-lived admin token. |
| `POST` | `/admin/logout` | Revokes admin token. |
| `GET` | `/admin/dashboard` | Aggregated leads, users, logs, events, metrics. |
| `GET` | `/activity-logs` | Activity/audit log stream (alias for `/admin/activity-logs`). |
| `POST` | `/admin/change-password` | Updates admin access passcode with verification. |
| `GET` | `/admin/settings` | Retrieves global website settings. |
| `PUT` | `/admin/settings` | Updates global website settings. |
| `POST` | `/admin/users` | Creates a new user or team account. |
| `PUT` | `/admin/users/:id/role` | Updates user access role (`ADMIN`, `EMPLOYEE`, `STUDENT`). |
| `DELETE` | `/admin/users/:id` | Deletes a user account. |
| `POST` | `/admin/events` | Creates event/gallery item. |
| `PUT` | `/admin/events/:id` | Updates event/gallery item. |
| `DELETE` | `/admin/events/:id` | Deletes event/gallery item. |
| `POST` | `/admin/team` | Adds new faculty or leadership team member. |
| `PUT` | `/admin/team/:id` | Updates existing team member profile. |
| `DELETE` | `/admin/team/:id` | Removes team member. |
| `POST` | `/admin/courses` | Adds new curriculum course offering. |
| `PUT` | `/admin/courses/:id` | Updates course details and pricing. |
| `DELETE` | `/admin/courses/:id` | Removes course. |
| `GET` | `/admin/inquiries` | Lists customer inquiries and leads. |
| `PUT` | `/admin/inquiries/:id` | Updates inquiry status (`NEW`, `CONTACTED`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED`). |
| `DELETE` | `/admin/inquiries/:id` | Deletes inquiry lead record. |
| `POST` | `/admin/certificates/issue` | Issues student or workshop certificate. |
| `POST` | `/admin/certificates/:id/revoke` | Revokes a certificate. |
| `POST` | `/admin/certificates/:id/reinstate` | Reinstates a revoked certificate. |
| `DELETE` | `/admin/certificates/:id` | Deletes certificate record permanently. |

## Employee Portal

Employee routes require `Authorization: Bearer <sessionToken>` with `EMPLOYEE` role.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/employee/inquiries` | Lists leads and inquiries assigned for staff review. |
| `PUT` | `/employee/inquiries/:id` | Updates inquiry status and notes with employee audit trail. |

## Payments And Certificates

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/payments/create-order` | Creates server-priced payment order payload. |
| `POST` | `/payments/verify` | Records payment confirmation and application. |
| `POST` | `/certificates/generate` | Authenticated certificate generation. |
| `GET` | `/certificates/download/:id` | Downloads verified certificate PDF. |
| `GET` | `/certificates/verify/:id` | Verifies certificate metadata. |
| `POST` | `/generate-pdf` | Generates workshop completion certificate PDF with custom canvas positioning. |

