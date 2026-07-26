import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GlobalSettings {
  departments: string[];
  employees: string[];
  visitorPurposes: string[];
  meetingDurationMaxHours: number;
  companyName: string;
  companyLogo: string;
}

const defaultSettings: GlobalSettings = {
  departments: ['Engineering', 'HR', 'Sales', 'Management', 'Operations'],
  employees: ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams'],
  visitorPurposes: ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Personal'],
  meetingDurationMaxHours: 4,
  companyName: 'Acme Corporation',
  companyLogo: 'https://via.placeholder.com/150',
};

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: Partial<GlobalSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('vms_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('vms_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
