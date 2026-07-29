import React, { createContext, useContext, useState, useEffect } from 'react';

export type AlertPriority = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'PUSH';
  timestamp: string;
  read: boolean;
  priority: AlertPriority;
  acknowledgedBy?: string;
  acknowledgedTime?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  sendPush: (title: string, message: string, priority?: AlertPriority) => void;
  markAsRead: (id: string) => void;
  acknowledgeAlert: (id: string, user: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('vms_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const sendPush = (title: string, message: string, priority: AlertPriority = 'INFO') => {
    const notif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type: 'PUSH',
      timestamp: new Date().toISOString(),
      read: false,
      priority,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const acknowledgeAlert = (id: string, user: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true, acknowledgedBy: user, acknowledgedTime: new Date().toISOString() } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => n.priority === 'CRITICAL' && !n.acknowledgedBy ? n : { ...n, read: true }));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, sendPush, markAsRead, acknowledgeAlert, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
