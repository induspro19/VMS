# CHANGELOG

All notable changes to the Enterprise Visitor Management System will be documented in this file.

## [v3.1.0] - Production Release

### Added
- **Global Error Boundaries**: Introduced global application crash handling and user-friendly error recovery screens (`Unexpected Error`).
- **404 / 403 Pages**: Custom UI states for Page Not Found and Access Denied.
- **System Health Panel**: Read-only diagnostic dashboard for administrators displaying application version, build date, total visitors, and local storage usage.
- **Lazy Loading**: Integrated `React.lazy` and `Suspense` for massive performance improvements and chunk-size reduction on initial load.
- **Global Configuration**: Extracted scattered configuration values into a central `appConfig.ts` file for easy maintenance.
- **Documentation Suite**: Comprehensive markdown documentation covering installation, security, deployment, and role-specific manuals.

### Changed
- Rolled out the **Enterprise Design System** globally across all modules (Security, Reception, Employee, Reports).
- Upgraded the build pipeline with zero TypeScript, ESlint, or console errors.

---

## [v3.0.0] - Enterprise Design System
### Added
- Centralized CSS architecture using `src/css/` tokens (variables, layout, forms, tables, animations).
- Premium Admin Dashboard featuring glassmorphic KPI cards, robust Recharts integrations, and modern spacing.
### Changed
- Removed all localized page-level CSS files.
- Refactored UI primitives (Button, Card, Input) to inherit strict enterprise standards.

---

## [v2.2.0] - Analytics
### Added
- Reporting dashboards with historical export features.

---

## [v2.1.0] - Reception Module
### Added
- Front desk operator dashboard for managing pre-registrations and quick check-ins.

---

## [v2.0.0] - Enterprise Workflow
### Added
- Role-based access control (Admin, Security, Employee, Reception).
- Host approval workflows and context-based state management.
- Multi-step visitor registration and smart alerting.

---

## [v1.0.0] - Initial Prototype
### Added
- Initial React structure with local storage contexts.
- Basic check-in and checkout flows.
