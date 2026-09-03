# Security Specification & Threat Model for Firestore Security Rules

## 1. Data Invariants
1. **Equipment Integrity**: Every equipment document in `/equipments/{equipmentId}` must contain a valid string `id` matching `{equipmentId}`, valid non-empty `general` metadata, and valid structure for all sub-properties.
2. **Access Control**: Read operations are allowed for authenticated or system operators with legitimate access. Write operations require valid schema formatting and strictly guarded fields.
3. **Trash Retention**: Every trash document in `/trash/{trashId}` must contain valid `equipment` object, `deletedAt` timestamp, and valid `id`.
4. **Denial-of-Wallet & Injection Protection**: All string fields and IDs are bounded (e.g. `isValidId` <= 128 chars, alphanumeric + dashes/underscores). Arbitrary unbound keys are prohibited.

## 2. The Dirty Dozen Malicious Payloads

1. **ID Injection Attack**: Writing to `/equipments/invalid$$injection%%123` with non-alphanumeric chars. (Should return PERMISSION_DENIED)
2. **Junk Field Pollution**: Sending extra shadow/ghost fields like `{ isSuperAdmin: true, inject: "bypass" }` into equipment doc. (Should be rejected or bounded)
3. **Huge String DOS Attack**: Sending a 5MB string inside `name` or `updatedBy`. (Should return PERMISSION_DENIED due to size bounds)
4. **Orphaned Trash Record**: Writing trash without `equipment` payload or `deletedAt`. (Should return PERMISSION_DENIED)
5. **Timestamp Spoofing**: Attempting to forge future/retroactive `createdAt` without server-valid timestamps.
6. **Negative Count**: Writing negative numbers for `count` in sync metadata.
7. **Type Poisoning**: Sending boolean instead of object for `general` or array for `components`.
8. **Unauthorized Metadata Wipe**: Overwriting system sync metadata with non-numeric version.
9. **Null Equipment ID**: Writing an equipment doc with empty string or null `id`.
10. **Array Explosion**: Attempting to inject 50,000 components in a single payload.
11. **Malicious GasUrl Injection**: Injecting javascript URI or script tags in `gasUrl`.
12. **Unauthenticated Tampering**: Modifying database records with invalid credentials.
