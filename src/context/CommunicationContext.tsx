import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export type CommunicationChannel = 'WhatsApp' | 'Push Notification' | 'Email' | 'SMS';
export type CommunicationStatus = 'Sent' | 'Failed' | 'Pending';

export interface CommunicationLog {
  id: string;
  date: string;
  time: string;
  visitorName: string;
  recipient: string;
  type: CommunicationChannel;
  template: string;
  status: CommunicationStatus;
}

interface CommunicationContextType {
  logs: CommunicationLog[];
  sendCommunication: (
    visitorName: string, 
    recipient: string, 
    type: CommunicationChannel, 
    template: string, 
    message: string
  ) => void;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<CommunicationLog[]>(() => {
    const saved = localStorage.getItem('vms_communication_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('vms_communication_logs', JSON.stringify(logs));
  }, [logs]);

  const sendCommunication = (
    visitorName: string,
    recipient: string,
    type: CommunicationChannel,
    template: string,
    message: string
  ) => {
    const now = new Date();
    const newLog: CommunicationLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      visitorName,
      recipient,
      type,
      template,
      status: 'Sent',
    };

    setLogs(prev => [newLog, ...prev]);
    
    // Simulate sending by showing a toast
    toast(`[${type}] Sent to ${recipient}: ${template}`, 'info');
    console.log(`[SIMULATED ${type}] To: ${recipient} | Template: ${template}\nMessage: ${message}`);
  };

  return (
    <CommunicationContext.Provider value={{ logs, sendCommunication }}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
