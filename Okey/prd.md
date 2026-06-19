# MASTER PROMPT — VAULTSHEET

You are acting as a Principal Security Engineer, Staff Software Engineer, Product Manager, UX Designer, QA Lead, Technical Writer, Threat Modeling Specialist, Cryptography Reviewer, and Chrome Extension Architect.

Your task is to design and implement a production-grade Chrome Extension named "VaultSheet".

VaultSheet is a privacy-first, zero-knowledge password manager that uses Google Sheets + Google Apps Script only as encrypted storage and synchronization infrastructure.

The system must be secure enough that compromise of:

* Google Sheets
* Google Apps Script
* Browser Storage
* Chrome Sync
* Network Traffic

does NOT expose user credentials.

==================================================
CRITICAL EXECUTION RULES
========================

PHASE 1 ONLY.

DO NOT WRITE CODE.

DO NOT CREATE FILES.

DO NOT GENERATE IMPLEMENTATION.

FIRST:

1. Analyze requirements.
2. Identify missing requirements.
3. Identify technical risks.
4. Identify security risks.
5. Challenge assumptions.
6. Suggest better alternatives.
7. Create implementation plan.
8. Create architecture diagrams.
9. Create security model.
10. Create threat model.
11. Create UX plan.
12. Create data model.
13. Create API specification.
14. Create storage model.
15. Create sync strategy.
16. Create testing strategy.
17. Create deployment strategy.
18. Create rollback strategy.
19. Create migration strategy.
20. Create disaster recovery strategy.

After Phase 1:

STOP.

Wait for explicit approval.

Only continue when the user replies:

PROCEED

If approval has not been given:

DO NOT WRITE CODE.

==================================================
PRODUCT VISION
==============

Build a secure browser-based password manager that:

* Stores credentials
* Stores TOTP secrets
* Generates OTP codes locally
* Recommends credentials based on current website
* Uses strong client-side encryption
* Supports secure synchronization
* Supports vault recovery
* Supports multiple devices
* Supports future passkey integration

The solution must be suitable for:

* Personal users
* Small teams
* Power users
* Privacy-conscious users

==================================================
CORE SECURITY PRINCIPLE
=======================

ZERO KNOWLEDGE.

Google Sheets must never know:

* Passwords
* TOTP secrets
* Vault keys
* Master passwords

Apps Script must never know:

* Passwords
* TOTP secrets
* Vault keys
* Master passwords

Servers must never decrypt data.

All encryption and decryption happens locally.

==================================================
CRYPTOGRAPHY REQUIREMENTS
=========================

Mandatory:

* AES-256-GCM
* Argon2id preferred
* PBKDF2 fallback
* Unique vault salt
* Secure random IVs
* Authenticated encryption
* Secure key derivation
* Cryptographically secure randomness
* Key rotation support
* Vault re-keying support

Create a detailed cryptographic design document.

Explain:

* Key derivation flow
* Encryption flow
* Decryption flow
* Recovery flow
* Re-keying flow

==================================================
MASTER PASSWORD DESIGN
======================

Master password must NEVER be stored.

Master password must only exist:

* During login
* During vault unlock

Vault key must be derived from:

Master Password
+
Salt
+
Argon2id

The derived key must only exist in memory.

RAM only.

Never persist vault keys.

Never store vault keys in:

* Google Sheets
* Apps Script
* Chrome Storage
* Local Storage
* IndexedDB
* Sync Storage

Create a complete lifecycle diagram showing:

* Unlock
* Usage
* Auto-lock
* Memory clearing

==================================================
RECOVERY STRATEGY
=================

Design a secure recovery system.

Mandatory support for:

1. Recovery Key
2. Vault Export
3. Device Migration

Recovery Key Requirements:

* Generated during setup
* High entropy
* Human-readable
* Downloadable
* Printable
* User warned to store safely

Recovery Key must allow:

* Vault recovery
* Master password reset
* Device migration

Create a complete recovery flow.

Explain:

* Lost master password
* New computer
* Lost extension
* Browser reinstall
* Device replacement

==================================================
BIOMETRIC UNLOCK
================

Support:

* Windows Hello
* Touch ID
* WebAuthn
* Passkeys
* Fingerprint unlock

Biometric authentication must:

NOT replace encryption.

Biometrics must only unlock access to locally protected vault access mechanisms.

Create:

* Security model
* UX model
* Recovery model

Explain limitations.

==================================================
DATA MODEL
==========

Each entry supports:

* ID
* Domain
* Site Name
* Username
* Password
* TOTP Secret
* Notes
* Tags
* Created Date
* Updated Date
* Last Used Date
* Favorite
* Custom Fields

Sensitive fields encrypted.

Metadata may remain searchable.

Design:

* Vault schema
* Encryption schema
* Version schema

==================================================
GOOGLE SHEETS BACKEND
=====================

Apps Script is transport only.

Apps Script may:

* Store encrypted payloads
* Return encrypted payloads

Apps Script may NOT:

* Decrypt data
* Store plaintext
* Generate OTPs

Design:

* Sync protocol
* Versioning protocol
* Conflict resolution
* Retry strategy
* Offline queue
* Recovery process

==================================================
CHROME EXTENSION FEATURES
=========================

Mandatory:

* Add credential
* Edit credential
* Delete credential
* Search credentials
* Password reveal
* Password copy
* Username copy
* OTP copy
* OTP generation
* Current-site detection
* Recommended credentials
* Favorites
* Recent entries
* Password generator
* Manual sync
* Auto sync
* Lock vault
* Unlock vault
* Recovery key management
* Import
* Export

==================================================
SMART SITE DETECTION
====================

When popup opens:

1. Detect active tab.
2. Extract root domain.
3. Match stored domains.
4. Rank confidence.
5. Show matching credentials first.

Examples:

mail.google.com
→ google.com

github.com
→ github.com

subdomain.company.com
→ company.com

Create matching strategy.

==================================================
PASSWORD GENERATOR
==================

Support:

* Length control
* Symbols
* Numbers
* Mixed case
* Memorable passwords
* Passphrases

Generate entropy calculations.

==================================================
SECURITY FEATURES
=================

Mandatory:

* Auto-lock
* Clipboard auto-clear
* Session timeout
* CSP hardening
* No eval()
* No inline JS
* Dependency auditing
* Secure headers
* Supply-chain protection
* Tamper detection strategy

No:

* Analytics
* Telemetry
* Tracking
* Ads

==================================================
THREAT MODEL
============

Analyze:

* Stolen Google Sheet
* Compromised Apps Script
* Browser compromise
* Malware
* Clipboard theft
* Session hijacking
* Extension compromise
* Dependency attacks
* MITM attacks
* Phishing
* Supply chain attacks
* Lost device
* Forgotten password
* Rogue employee
* Sync conflicts

For each:

* Description
* Severity
* Likelihood
* Mitigation
* Residual risk

==================================================
UX REQUIREMENTS
===============

Create wireframes for:

Popup

* Current Site
* Recommended Credentials
* Search
* Favorites
* Recent
* Sync Status

Credential Detail

* Username
* Password
* OTP
* Notes
* Copy Actions

Settings

* Security
* Recovery
* Sync
* Biometrics
* Import/Export

==================================================
PERFORMANCE REQUIREMENTS
========================

Popup Open:
<300ms

Vault Unlock:
<500ms

Search:
<100ms

OTP:
<50ms

Scale Target:

10,000+
credentials

==================================================
TESTING REQUIREMENTS
====================

Create:

* Unit Tests
* Integration Tests
* E2E Tests
* Security Tests
* Load Tests
* Penetration Tests
* Cryptographic Validation Tests
* Browser Compatibility Tests

Coverage Goal:

90%+

==================================================
FUTURE ROADMAP
==============

Evaluate future support for:

* Firefox
* Edge
* Safari
* Mobile Companion App
* Passkeys
* Team Sharing
* Secure Notes
* Attachments
* Multiple Vaults
* Self-hosted Backends
* Firestore
* Supabase
* Cloudflare D1

==================================================
PHASE 1 DELIVERABLES
====================

Produce:

1. Executive Summary
2. Product Requirements
3. Missing Requirements
4. Security Architecture
5. Cryptography Design
6. Master Password Design
7. Recovery Design
8. Biometric Design
9. Threat Model
10. Data Model
11. API Design
12. Sync Architecture
13. Folder Structure
14. Wireframes
15. Testing Strategy
16. Deployment Plan
17. Rollback Plan
18. Migration Plan
19. Disaster Recovery Plan
20. Risk Register
21. Future Roadmap
22. Implementation Checklist

After generating the document:

STOP.

Wait for user approval.

Only begin implementation after:

PROCEED

When implementation starts:

* Build incrementally
* Explain decisions
* Create production-grade code
* Include documentation
* Include tests
* Include setup instructions
* Include deployment instructions
* Include security review notes
* Run security validation before completion

Never skip security review.

Never skip testing.

Never skip documentation.

Never start coding before approval.