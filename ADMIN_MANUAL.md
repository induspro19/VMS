# Admin Manual
## Enterprise Visitor Management System

The Admin Dashboard is the central control hub for the VMS.

### Capabilities
1. **System Health Panel**: Navigate to `/admin/health` to view realtime diagnostics on storage usage, active visitors, and client data.
2. **Visitor Profiles**: Access detailed views of any visitor's complete timeline (check-ins, approvals, force exits, and SMS/WhatsApp communications).
3. **Reports & Exports**: Filter data by date, department, or host and export cleanly to PDF or Excel.
4. **Settings Configuration**: Modify Departments, Employees, Visitor Purposes, and general company constraints.

### Daily Tasks
- Check the System Health panel to ensure `localStorage` is not overflowing.
- Review Force Exits (`isOverride = true`) to audit security interventions.
- Ensure department and employee directories are up-to-date in the Settings module.
