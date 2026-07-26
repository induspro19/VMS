# Backup and Restore
## Enterprise Visitor Management System

Since the application currently relies on `localStorage` for database operations, it is critical to perform regular backups to prevent data loss.

### Manual Backup Procedure
1. Log in to the application as an `ADMIN`.
2. Navigate to `Admin Dashboard` > `Reports`.
3. In the top right corner, click `Export All to JSON`.
4. Save the file `vms_backup_YYYYMMDD.json` in a secure, backed-up location.

### Manual Restore Procedure
1. Open the Developer Tools in your browser (F12 or Ctrl+Shift+I).
2. Go to the `Console` tab.
3. Paste the contents of your backed up JSON file into the appropriate localStorage keys:
```javascript
const backup = { /* paste JSON here */ };
localStorage.setItem('vms_visitors', JSON.stringify(backup.visitors));
localStorage.setItem('vms_audit_logs', JSON.stringify(backup.auditLogs));
// refresh the page
```

*Note: A future backend version will automate these backups using CRON jobs and database dumps.*
