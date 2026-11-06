# Operations Team Training

## Daily Checks

1. Open `/api/health` and confirm `status: ok`.
2. Confirm the newest backup exists under `backups/snapshot_*`.
3. Review admin dashboard totals for unusual spikes in failed logins, leads, or certificate requests.
4. Check hosting/CDN monitoring for 5xx errors and elevated latency.

## Lead Handling

1. Sign in through the admin portal using the production admin passcode.
2. Review contact inquiries, program interests, applications, newsletters, and feedback.
3. Export or copy only the minimum personal data needed for follow-up.
4. Do not share admin tokens, raw data files, or backup archives outside approved systems.

## Certificate Handling

1. Use authenticated account access to generate certificates.
2. Verify generated certificates through `/api/certificates/verify/:id`.
3. Use `/api/certificates/download/:id` for official PDF downloads.
4. Escalate duplicate or suspicious certificate IDs before responding to the requester.

## Privacy Requests

1. Confirm the requester owns the account before exporting or deleting data.
2. Use `/api/auth/export-data` for account exports.
3. Use `/api/auth/delete-account` for self-service account deletion after password verification.
4. Record the request date, completion date, and support owner in the privacy request log.

## Incident Escalation

Escalate immediately when:

- `/api/health` fails.
- admin login attempts spike.
- backup has not completed for more than 24 hours.
- payment or certificate workflows produce inconsistent records.
- a user reports exposed personal data.

First responder actions:

1. Preserve logs and current data state.
2. Notify the technical owner.
3. Avoid manual edits to JSON data unless approved.
4. If active abuse continues, block the route/IP at CDN or Nginx.
