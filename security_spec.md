# Security Specification — MUSTAFA.dev Owner-Only Contact Inbox

## 1. Data Invariants
1. **Strict Owner Read/Manage Isolation**: Contact inquiries stored at `/messages/{messageId}` contain Personally Identifiable Information (`name`, `email`, `message`). Only the verified website owner (`request.auth != null && request.auth.token.email == 'hussainmustafa2001@gmail.com' && request.auth.token.email_verified == true`) may perform `get`, `list`, `update`, or `delete` operations.
2. **Public Visitor Submission Invariant**: Any visitor may submit (`create`) a new contact inquiry at `/messages/{messageId}` ONLY if:
   - `messageId` matches `^[a-zA-Z0-9_\-]+$` and is `<= 128` characters.
   - The payload contains ONLY the exact required keys `['name', 'email', 'message', 'source', 'read', 'recipientEmail', 'createdAt']`.
   - `name` is a string (`1..100` chars), `email` is a valid email string (`3..254` chars), `message` is a string (`1..5000` chars), `source` is `'form'` or `'terminal'`.
   - `read` is initialized to `false`.
   - `recipientEmail` is strictly `'hussainmustafa2001@gmail.com'`.
   - `createdAt` equals `request.time` (server timestamp).
3. **Immutable Fields on Update**: When the owner updates a message to toggle `read`, only `['read', 'updatedAt']` may change, `updatedAt` must equal `request.time`, and `name`, `email`, `message`, `source`, `recipientEmail`, and `createdAt` must remain unchanged.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read (`get` / `list`)**: Visitor without auth attempts to read `/messages/msg-1` or list `/messages` -> `PERMISSION_DENIED`.
2. **Non-Owner Authenticated Read**: Authenticated user `attacker@gmail.com` (`email_verified: true`) attempts to `get` or `list` `/messages` -> `PERMISSION_DENIED`.
3. **Unverified Owner Email Spoof**: User with `email: 'hussainmustafa2001@gmail.com'` but `email_verified: false` attempts to `get` or `list` `/messages` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Visitor submits valid fields plus `"isAdmin": true` -> `PERMISSION_DENIED`.
5. **Pre-Read Message Creation**: Visitor submits `"read": true` on `create` -> `PERMISSION_DENIED`.
6. **Recipient Hijacking on Create**: Visitor sets `"recipientEmail": "attacker@gmail.com"` on `create` -> `PERMISSION_DENIED`.
7. **Forged Client Timestamp on Create**: Visitor sends past/future timestamp (`createdAt != request.time`) -> `PERMISSION_DENIED`.
8. **Oversized Message Payload (Denial of Wallet)**: Visitor sends `message` with `5001` characters -> `PERMISSION_DENIED`.
9. **Invalid Email Format on Create**: Visitor sends `email: "not-an-email"` -> `PERMISSION_DENIED`.
10. **Path Variable ID Poisoning**: Visitor attempts to create document with invalid ID characters or length > 128 -> `PERMISSION_DENIED`.
11. **Unauthorized Visitor Delete**: Non-owner attempts to delete `/messages/msg-1` -> `PERMISSION_DENIED`.
12. **Owner Immutable Field Mutation**: Owner attempts to modify `message` or `email` during `update` -> `PERMISSION_DENIED`.
