# OSK Granite ERP - Security Notes

## Overview

This repository contains client-side security utilities in `src/app/services/securityService.ts` for:

- input validation and sanitization
- data masking for sensitive fields
- role and branch access helpers
- session timeout utilities
- audit log shaping in the client

## Backend Status

- The previous Firebase authentication, Firestore rules, seed scripts, and deployment scaffolding have been removed from this repository.
- Authentication, authorization, and persistence enforcement must be implemented in the backend you connect next.

## Important

- Client-side validation improves UX, but it is not a security boundary.
- Any replacement backend should enforce authentication, authorization, rate limits, and data access rules server-side.

## Relevant Files

- `src/app/services/securityService.ts`
- `src/app/components/auth/AuthGuard.tsx`
- `src/app/utils/permissions.ts`
