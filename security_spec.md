# Security Specification - DAHSHA Network

## 1. Data Invariants

1. **Serial Sanctity**: Document IDs for collections `activated_serials` and `backups` must match the pre-generated valid randomized alphanumeric format: `DAH-[A-Z0-9]{4}-[A-Z0-9]{4}` with exact length 13.
2. **First-Write Locking**: Once an `activated_serials` record is created for a serial, its `networkName` is immutable and cannot be edited, deleted, or transferred.
3. **Relational Invariant**: Backups can only be saved under a `{serial}` document if the payload's `networkName` exactly matches the bound `networkName` in `activated_serials/{serial}`. This prevents one network from writing over another network's backups.
4. **Data Integrity**: All backup payloads must structure transaction records in native Firestore lists (`salesHistory` and `shops`) rather than flat string arrays or custom fields.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Unregistered Serial Write**: Inserting a document with ID `MALICIOUS-999` into `activated_serials`. Must return `PERMISSION_DENIED`.
2. **Serial Hijacking**: Attempting to update `activated_serials/DAH-K9B2-S4F8` to change the bound `networkName` from "Al-Amal Network" to "Al-Hassan Network". Must return `PERMISSION_DENIED`.
3. **Backup Spoofer**: Saving a backup under `backups/DAH-D7W3-M1G9` with `networkName: "Fraudulent Network"` when `activated_serials/DAH-D7W3-M1G9` is bound to `"Original Network"`. Must return `PERMISSION_DENIED`.
4. **Blanket Overwrite Attack**: Bypassing size and validation criteria by writing arbitrary keys to `backups/DAH-Y3F7-N5M8` (e.g., adding `adminEnabled: true`). Must return `PERMISSION_DENIED`.
5. **No Network Name Activation**: Activating a serial with an empty network name. Must return `PERMISSION_DENIED`.
6. **Denial of Wallet Junk ID**: Attempting to query or create document ID `DAH-K9B2-S4F8-JUNK-DATA-JUNK-DATA-JUNK-DATA-JUNK-DATA` exceeding length limits. Must return `PERMISSION_DENIED`.
7. **Type Poisoning (Sales History)**: Writing `salesHistory: "not-a-list"` to `backups/DAH-Q9Z2-K4W1`. Must return `PERMISSION_DENIED`.
8. **Type Poisoning (Shops)**: Writing `shops: { "not": "a-list" }` to `backups/DAH-Q9Z2-K4W1`. Must return `PERMISSION_DENIED`.
9. **No-Binding Backup Write**: Saving a backup to `backups/DAH-C6H8-B2X9` before the serial is ever activated in `activated_serials`. Must return `PERMISSION_DENIED`.
10. **Serial Deletion Attack**: Attempting to delete `activated_serials/DAH-K9B2-S4F8`. Must return `PERMISSION_DENIED`.
11. **Malicious Backup Deletion**: Attempting to delete `backups/DAH-K9B2-S4F8` to erase the backup history of another operator. Must return `PERMISSION_DENIED`.
12. **Bulk Read Scraper**: Scrambling client-side queries to list ALL client backups. Must return `PERMISSION_DENIED`.

---

## 3. Test Invariants

The security rules are structured mathematically to negate all twelve vectors. All data is isolated by its path variable (`serial`) and validated in O(1) time without triggering recursive O(n) scraping vulnerabilities.
