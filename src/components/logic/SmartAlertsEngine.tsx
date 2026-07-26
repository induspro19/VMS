import React, { useEffect } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useNotification } from '../../context/NotificationContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export const SmartAlertsEngine: React.FC = () => {
  const { visitors } = useVisitor();
  const { sendPush, notifications } = useNotification();
  const { settings } = useSettings();
  const { toast } = useToast();

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date().getTime();

      visitors.forEach(v => {
        // Only active visits
        if (v.status === 'COMPLETED' || v.status === 'REJECTED') return;

        let alertKey = '';
        let title = '';
        let message = '';
        let priority: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';

        // Rule 1: Waiting Approval too long (> 15 mins)
        if (v.status === 'PENDING_APPROVAL') {
          const waitingTime = (now - new Date(v.registrationTime).getTime()) / (1000 * 60);
          if (waitingTime > 15) {
            alertKey = `wait_approve_${v.id}`;
            title = 'Visitor Waiting Approval';
            message = `${v.name} has been waiting >15m for approval by ${v.employeeToMeet}.`;
            priority = 'WARNING';
          }
        }

        // Rule 2: Waiting at Gate too long (> 30 mins)
        if (v.status === 'APPROVED') {
          const waitingGate = (now - new Date(v.registrationTime).getTime()) / (1000 * 60);
          if (waitingGate > 30) {
            alertKey = `wait_gate_${v.id}`;
            title = 'Visitor Waiting at Gate';
            message = `${v.name} is approved but hasn't entered for >30m.`;
            priority = 'WARNING';
          }
        }

        // Rule 3: Inside beyond expected duration
        if (v.status === 'INSIDE' && v.entryTime) {
          const hoursInside = (now - new Date(v.entryTime).getTime()) / (1000 * 60 * 60);
          if (hoursInside > settings.meetingDurationMaxHours) {
            alertKey = `overdue_${v.id}`;
            title = 'Visitor Overdue';
            message = `${v.name} has been inside for >${settings.meetingDurationMaxHours} hours.`;
            priority = 'CRITICAL';
          }
        }

        // Rule 4: Meeting completed but still inside (> 15 mins)
        if (v.status === 'READY_FOR_EXIT') {
          // Approximation: Since READY_FOR_EXIT doesn't have a strict transition timestamp natively saved separate from exitTime, 
          // we use a heuristic based on current time. 
          // We can prevent spam by ensuring it only fires once.
          alertKey = `ready_exit_${v.id}`;
          title = 'Missing Checkout';
          message = `${v.name} finished meeting but hasn't checked out at gate.`;
          priority = 'WARNING';
        }

        // Emit Alert
        if (alertKey && !notifications.some(n => n.message === message)) {
          sendPush(title, message, priority);
          if (priority === 'CRITICAL') toast(message, 'error');
          else if (priority === 'WARNING') toast(message, 'warning');
        }
      });
    };

    const interval = setInterval(checkAlerts, 60000); // Check every minute
    checkAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [visitors, settings, notifications, sendPush, toast]);

  return null; // This is a logic-only component
};
