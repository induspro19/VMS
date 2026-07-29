import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SecurityOfficer {
  id: string;
  name: string;
  badgeNumber?: string;
  mobile?: string;
  isActive: boolean;
  createdAt: string;
}

export type ShiftType = 'Morning' | 'Evening' | 'Night';

export interface ActiveShift {
  officerName: string;
  shift: ShiftType;
  loginTime: string;
}

const DEFAULT_OFFICERS: SecurityOfficer[] = [
  { id: 'off-1', name: 'Ramesh Patel', badgeNumber: 'SEC-001', mobile: '9876500001', isActive: true, createdAt: new Date().toISOString() },
  { id: 'off-2', name: 'Suresh Kumar', badgeNumber: 'SEC-002', mobile: '9876500002', isActive: true, createdAt: new Date().toISOString() },
  { id: 'off-3', name: 'Mahesh Shah', badgeNumber: 'SEC-003', mobile: '9876500003', isActive: true, createdAt: new Date().toISOString() },
  { id: 'off-4', name: 'Main Gate Security', badgeNumber: 'SEC-000', mobile: '9876500000', isActive: true, createdAt: new Date().toISOString() }
];

const OFFICERS_STORAGE_KEY = 'vms_security_officers';
const ACTIVE_SHIFT_STORAGE_KEY = 'vms_security_active_shift';

interface SecurityShiftContextType {
  activeShift: ActiveShift | null;
  officers: SecurityOfficer[];
  startShift: (officerName: string, shift: ShiftType) => void;
  changeShift: (officerName: string, shift: ShiftType) => void;
  addOfficer: (name: string, badgeNumber?: string, mobile?: string) => void;
  updateOfficer: (id: string, updates: Partial<SecurityOfficer>) => void;
  deleteOfficer: (id: string) => void;
  toggleOfficerActive: (id: string) => void;
}

const SecurityShiftContext = createContext<SecurityShiftContextType | undefined>(undefined);

export const SecurityShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load officers from LocalStorage
  const [officers, setOfficers] = useState<SecurityOfficer[]>(() => {
    try {
      const local = localStorage.getItem(OFFICERS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading security officers from localStorage:', e);
    }
    return DEFAULT_OFFICERS;
  });

  // Load active shift from LocalStorage
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(() => {
    try {
      const local = localStorage.getItem(ACTIVE_SHIFT_STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error('Error loading active shift from localStorage:', e);
    }
    return null;
  });

  const saveOfficersToLocal = (newList: SecurityOfficer[]) => {
    try {
      localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving officers to localStorage:', e);
    }
  };

  const saveShiftToLocal = (shift: ActiveShift | null) => {
    try {
      if (shift) {
        localStorage.setItem(ACTIVE_SHIFT_STORAGE_KEY, JSON.stringify(shift));
      } else {
        localStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving shift to localStorage:', e);
    }
  };

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteOfficers = async () => {
      try {
        const { data, error } = await supabase.from('security_officers').select('*');
        if (!error && data && data.length > 0 && isMounted) {
          const mapped: SecurityOfficer[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            badgeNumber: d.badge_number || '',
            mobile: d.mobile || '',
            isActive: d.is_active !== false,
            createdAt: d.created_at || new Date().toISOString()
          }));

          setOfficers(prev => {
            const map = new Map<string, SecurityOfficer>();
            mapped.forEach(o => map.set(o.name.toLowerCase(), o));
            prev.forEach(o => {
              if (!map.has(o.name.toLowerCase())) map.set(o.name.toLowerCase(), o);
            });
            const merged = Array.from(map.values());
            saveOfficersToLocal(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Supabase security_officers fetch fallback:', err);
      }
    };
    void fetchRemoteOfficers();
    return () => { isMounted = false; };
  }, []);

  const ensureOfficerExists = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const exists = officers.some(o => o.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      const newOff: SecurityOfficer = {
        id: 'off-' + Math.random().toString(36).substr(2, 9),
        name: cleanName,
        badgeNumber: `SEC-${Math.floor(100 + Math.random() * 900)}`,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      setOfficers(prev => {
        const updated = [...prev, newOff];
        saveOfficersToLocal(updated);
        return updated;
      });

      // Dual write to Supabase
      supabase.from('security_officers').insert([{
        id: newOff.id,
        name: newOff.name,
        badge_number: newOff.badgeNumber,
        is_active: true
      }]).then(({ error }) => {
        if (error) console.warn('Supabase insert officer error:', error);
      });
    }
  };

  const startShift = (officerName: string, shift: ShiftType) => {
    const cleanName = officerName.trim();
    ensureOfficerExists(cleanName);

    const shiftData: ActiveShift = {
      officerName: cleanName,
      shift,
      loginTime: new Date().toISOString()
    };

    setActiveShift(shiftData);
    saveShiftToLocal(shiftData);
  };

  const changeShift = (officerName: string, shift: ShiftType) => {
    startShift(officerName, shift);
  };

  const addOfficer = (name: string, badgeNumber?: string, mobile?: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const newOff: SecurityOfficer = {
      id: 'off-' + Math.random().toString(36).substr(2, 9),
      name: cleanName,
      badgeNumber: badgeNumber || `SEC-${Math.floor(100 + Math.random() * 900)}`,
      mobile,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setOfficers(prev => {
      const updated = [...prev.filter(o => o.name.toLowerCase() !== cleanName.toLowerCase()), newOff];
      saveOfficersToLocal(updated);
      return updated;
    });

    supabase.from('security_officers').upsert([{
      id: newOff.id,
      name: newOff.name,
      badge_number: newOff.badgeNumber,
      mobile: newOff.mobile,
      is_active: true
    }]).then(({ error }) => {
      if (error) console.warn('Supabase addOfficer error:', error);
    });
  };

  const updateOfficer = (id: string, updates: Partial<SecurityOfficer>) => {
    setOfficers(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      saveOfficersToLocal(updated);
      return updated;
    });

    supabase.from('security_officers').update({
      name: updates.name,
      badge_number: updates.badgeNumber,
      mobile: updates.mobile,
      is_active: updates.isActive
    }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase updateOfficer error:', error);
    });
  };

  const deleteOfficer = (id: string) => {
    setOfficers(prev => {
      const updated = prev.filter(o => o.id !== id);
      saveOfficersToLocal(updated);
      return updated;
    });

    supabase.from('security_officers').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase deleteOfficer error:', error);
    });
  };

  const toggleOfficerActive = (id: string) => {
    const off = officers.find(o => o.id === id);
    if (off) {
      updateOfficer(id, { isActive: !off.isActive });
    }
  };

  return (
    <SecurityShiftContext.Provider value={{
      activeShift,
      officers,
      startShift,
      changeShift,
      addOfficer,
      updateOfficer,
      deleteOfficer,
      toggleOfficerActive
    }}>
      {children}
    </SecurityShiftContext.Provider>
  );
};

export const useSecurityShift = () => {
  const context = useContext(SecurityShiftContext);
  if (!context) {
    throw new Error('useSecurityShift must be used within a SecurityShiftProvider');
  }
  return context;
};
