# Website Failure Contact Report

Generated: 2026-09-14  
Production revision checked: `c8da34c`  
Scope checked: retained production Docker logs since 2026-09-10, current Caddy logs, live deployment configuration, and the production app state.

## Executive Summary

No names or email addresses were present in the retained production failure logs. Because failed registration/login POST bodies are not logged and invalid registrations are not saved to the database, there is no reliable list of people to contact from the current logs.

This means we cannot produce a confirmed outreach list of "people who tried to connect but could not because of website failures" without over-collecting unrelated production users or enquiries.

## Confirmed Website Issues

### 1. `www.fusbus.org` login/registration origin mismatch

Users who opened `https://www.fusbus.org` could submit forms from the `www` origin while the app trusted only `https://fusbus.org`. This caused the security message:

> For your security, that sign-in request could not be verified.

Fix deployed: `5b5a6db` on 2026-09-11.  
Current status: fixed. `https://www.fusbus.org/...` now redirects to `https://fusbus.org/...`.

### 2. Registration form failures showed a generic message

Registrations that failed server validation showed:

> Please check the registration form and try again.

Likely causes included password rules, invalid email formatting, or too-short name/business fields. The form did not show field-specific messages, making it difficult for users to recover.

Fix deployed: `c8da34c` on 2026-09-14.  
Current status: fixed. Registration now trims identity fields, enforces password rules in-browser, and shows field-level validation details.

## Contactable People Found In Failure Logs

None.

The retained logs contained no email addresses and no submitted names associated with failed login or registration attempts.

## Log Evidence Reviewed

### App logs

Command scope: `docker logs --since 2026-09-10T00:00:00 app-app-1`

Findings:

- Email addresses found in app logs: `0`
- Failure-related app log lines found by keywords (`error`, `failed`, `register`, `registration`, `login`, `blocked`, `invalid`, `csrf`, `Cross-site`, `Unauthorized`): `0`

### Caddy/proxy logs

Command scope: `docker logs --since 2026-09-10T00:00:00 app-caddy-1`

Findings:

- Warning count: `15`
- Warning type: `aborting with incomplete response`
- Affected paths were static/image assets, not form submissions:
  - `/_next/image`: 5
  - `/_next/static/chunks/3jg84jwj6s1uj.js`: 2
  - `/_next/static/chunks/1j_9b-l0n6u-t.js`: 2
  - `/_next/static/chunks/0nzoueya5enld.js`: 2
  - `/_next/static/chunks/turbopack-0k0huungpquih.js`: 1
  - `/_next/static/chunks/3yfl9fgvivx3-.js`: 1
  - `/_next/static/chunks/11jq0c2_zavac.js`: 1

These warnings appear to be client/browser aborted static asset requests, mostly from mobile/Facebook in-app browser traffic. They do not include names or email addresses.

## Why There Is No Email/Name Outreach List

The application currently handles failed form submissions in a privacy-preserving way:

- Failed registration/login POST bodies are not logged.
- Failed registration attempts are not saved to the database.
- Caddy access logging is not enabled.
- Docker logs are retained only for running/recent containers and do not include historical request bodies.

That is generally good for privacy, but it means the current logs cannot identify users who failed before account creation.

## People We Should Not Include Without Extra Approval

Existing seller users, investor enquiries, and admin accounts do contain names/emails, but those records do not prove a website failure. Including them as "failed because of website issues" would be inaccurate and would over-collect personal data.

## Recommended Follow-Up

1. Add a privacy-safe `FailedFormAttempt` table for registration/contact failures.
2. Store only operationally useful fields:
   - form type
   - timestamp
   - email/name fields if the user typed them
   - validation error code
   - user-facing error reason
   - request origin/host
3. Avoid storing passwords, message bodies, full user agents, or unnecessary IP addresses.
4. Add a short admin report page or script to export failed attempts for follow-up.
5. Enable limited Caddy access logging with retention, excluding request bodies and sensitive query strings.

## Current Production Status

- `www` canonical redirect: fixed
- Registration validation detail: fixed
- Production revision: `c8da34c`
- App, Caddy, and database containers: running
