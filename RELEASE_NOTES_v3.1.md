# Release Notes v3.1
**Date:** July 2026
**Status:** Production Candidate

### Overview
Version 3.1 focuses exclusively on production readiness, hardening the application for live user acceptance testing (UAT).

### High-Impact Changes
- **React Suspense & Lazy Loading**: Split the main `1.4MB` JS chunk into route-based dynamic imports. The initial load time has been drastically reduced.
- **Global Error Boundaries**: Introduced a `GlobalErrorBoundary` wrapper. UI crashes will no longer result in a blank white screen; a friendly "Unexpected Error" state will be shown.
- **HTTP Error States**: Added `NotFoundPage` (404) and `ForbiddenPage` (403) for strict routing security.
- **System Health Diagnostics**: Administrators can now monitor browser memory usage and application build data via the new Health Panel.

### Known Limitations
- Data is stored in `localStorage`. This is sufficient for the pilot phase, but a secure Backend API (Node/SQL) must be integrated for Version 4.0.
- Cross-browser syncing is not possible while in local-storage mode.
