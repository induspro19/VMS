import React from 'react';
import { X, Bell, Check, Trash2, Clock } from 'lucide-react';
import './NotificationCenter.css';

export interface EmployeeNotification {
  id: string;
  employee_id: string;
  title: string;
  message: string;
  type: string;
  visitor_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EmployeeNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onOpenVisitor: (visitorId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead, onDelete, onOpenVisitor
}) => {
  if (!isOpen) return null;

  const getIconColor = (type: string) => {
    switch (type) {
      case 'VISITOR_WAITING': return '#3B82F6'; // Blue
      case 'APPROVED': return '#10B981'; // Green
      case 'REJECTED': return '#EF4444'; // Red
      case 'REMINDER': return '#F59E0B'; // Yellow
      case 'MEETING_COMPLETED': return '#8B5CF6'; // Purple
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center-sidebar" onClick={e => e.stopPropagation()}>
        <div className="nc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Notifications</h2>
          </div>
          <button className="nc-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="nc-actions">
          <span style={{ fontSize: '13px', color: '#64748B' }}>{notifications.filter(n => !n.is_read).length} Unread</span>
          {notifications.some(n => !n.is_read) && (
            <button className="nc-mark-all" onClick={onMarkAllAsRead}>Mark all read</button>
          )}
        </div>

        <div className="nc-content">
          {notifications.length === 0 ? (
            <div className="nc-empty">
              <Bell size={32} color="#CBD5E1" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`nc-item ${notif.is_read ? 'read' : 'unread'}`}>
                <div className="nc-item-indicator" style={{ backgroundColor: getIconColor(notif.type) }} />
                <div className="nc-item-body">
                  <div className="nc-item-header">
                    <h4>{notif.title}</h4>
                    <span className="nc-time"><Clock size={10} /> {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p>{notif.message}</p>
                  <div className="nc-item-actions">
                    {notif.visitor_id && (
                      <button className="nc-btn primary" onClick={() => { onOpenVisitor(notif.visitor_id!); onClose(); }}>
                        Open Details
                      </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {!notif.is_read && (
                      <button className="nc-btn ghost" onClick={() => onMarkAsRead(notif.id)} title="Mark as read">
                        <Check size={14} />
                      </button>
                    )}
                    <button className="nc-btn ghost danger" onClick={() => onDelete(notif.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
