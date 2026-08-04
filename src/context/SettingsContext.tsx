import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EmergencyContact {
  id: string;       // client-generated uuid for React key / editing
  role: string;     // e.g. "Security Chief"
  phone: string;    // e.g. "+1 (555) 019-2831"
  isEmergency?: boolean; // renders number in danger-red (for 911-style numbers)
}

export interface GlobalSettings {
  departments: string[];
  employees: string[];
  visitorPurposes: string[];
  meetingDurationMaxHours: number;
  companyName: string;
  companyLogo: string;
  emergencyContacts: EmergencyContact[];
  _updatedAt?: number; // timestamp ms for conflict resolution
}

// Only used on absolute first install
const DB_DEFAULT_DEPARTMENTS = ['Engineering', 'HR', 'Sales', 'Management', 'Operations'];

const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'ec-1', role: 'Security Chief',   phone: '+1 (555) 019-2831', isEmergency: false },
  { id: 'ec-2', role: 'Facility Manager', phone: '+1 (555) 991-8273', isEmergency: false },
  { id: 'ec-3', role: 'Local Emergency',  phone: '911',               isEmergency: true  },
];

const FALLBACK_DEFAULTS: GlobalSettings = {
  departments: DB_DEFAULT_DEPARTMENTS,
  employees: [],
  visitorPurposes: ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Personal', 'Other'],
  meetingDurationMaxHours: 4,
  companyName: 'Enterprise VMS',
  companyLogo: '',
  emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
  _updatedAt: 0,
};

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: Partial<GlobalSettings>) => Promise<void>;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const LS_KEY = 'vms_settings_v2'; // new key to avoid stale data from old format

function mapRowToSettings(data: any): GlobalSettings {
  return {
    departments: Array.isArray(data.departments) ? data.departments : [],
    employees: [],
    visitorPurposes: Array.isArray(data.visitor_purposes) ? data.visitor_purposes : FALLBACK_DEFAULTS.visitorPurposes,
    meetingDurationMaxHours: data.meeting_duration_max_hours || FALLBACK_DEFAULTS.meetingDurationMaxHours,
    companyName: data.company_name || FALLBACK_DEFAULTS.companyName,
    companyLogo: data.company_logo || '',
    emergencyContacts: Array.isArray(data.emergency_contacts) ? data.emergency_contacts : DEFAULT_EMERGENCY_CONTACTS,
    _updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : 0,
  };
}

function getLocalSettings(): GlobalSettings | null {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveLocalSettings(s: GlobalSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(FALLBACK_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      const localData = getLocalSettings();

      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data && !error && isMounted) {
          const dbSettings = mapRowToSettings(data);
          const dbTimestamp = dbSettings._updatedAt || 0;
          const localTimestamp = localData?._updatedAt || 0;

          // Use whichever was updated more recently
          if (localTimestamp > dbTimestamp) {
            // Local is newer (Supabase write may have failed before) — push local to DB
            console.log('[Settings] localStorage is newer than Supabase — pushing local state to DB');
            setSettings(localData!);
            // Sync back to Supabase
            await supabase.from('app_settings').upsert({
              id: 1,
              departments: localData!.departments,
              visitor_purposes: localData!.visitorPurposes,
              meeting_duration_max_hours: localData!.meetingDurationMaxHours,
              company_name: localData!.companyName,
              company_logo: localData!.companyLogo,
              updated_at: new Date(localTimestamp).toISOString(),
            }, { onConflict: 'id' });
          } else {
            // DB is authoritative — use DB data and sync to localStorage
            setSettings(dbSettings);
            saveLocalSettings(dbSettings);
          }
        } else {
          // Supabase unavailable or table missing
          if (localData && isMounted) {
            setSettings(localData);
          } else if (isMounted) {
            // Very first install — seed defaults
            const firstInstall = { ...FALLBACK_DEFAULTS, _updatedAt: Date.now() };
            setSettings(firstInstall);
            saveLocalSettings(firstInstall);
            await supabase.from('app_settings').upsert({
              id: 1,
              departments: DB_DEFAULT_DEPARTMENTS,
              visitor_purposes: FALLBACK_DEFAULTS.visitorPurposes,
              meeting_duration_max_hours: FALLBACK_DEFAULTS.meetingDurationMaxHours,
              company_name: FALLBACK_DEFAULTS.companyName,
              emergency_contacts: DEFAULT_EMERGENCY_CONTACTS,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          }
        }
      } catch (err) {
        console.error('[Settings] Failed to load from Supabase:', err);
        if (localData && isMounted) {
          setSettings(localData);
        }
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    fetchSettings();

    // Realtime subscription — push DB changes to all open tabs
    const channel = supabase
      .channel('app_settings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        (payload) => {
          if (payload.new && isMounted) {
            const updated = mapRowToSettings(payload.new);
            const localData = getLocalSettings();
            // Only apply if DB is newer or equal to local
            if ((updated._updatedAt || 0) >= (localData?._updatedAt || 0)) {
              setSettings(updated);
              saveLocalSettings(updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    const now = Date.now();
    const merged: GlobalSettings = { ...settings, ...newSettings, _updatedAt: now };
    
    // 1. Update React state immediately
    setSettings(merged);
    
    // 2. Persist to localStorage immediately (always works)
    saveLocalSettings(merged);

    // 3. Try to persist to Supabase
    try {
      const { error } = await supabase.from('app_settings').upsert({
        id: 1,
        departments: merged.departments,
        visitor_purposes: merged.visitorPurposes,
        meeting_duration_max_hours: merged.meetingDurationMaxHours,
        company_name: merged.companyName,
        company_logo: merged.companyLogo,
        emergency_contacts: merged.emergencyContacts,
        updated_at: new Date(now).toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.warn('[Settings] Supabase write failed (RLS?):', error.message, '— saved to localStorage only');
      }
    } catch (err) {
      console.warn('[Settings] Supabase unreachable — saved to localStorage only:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
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
