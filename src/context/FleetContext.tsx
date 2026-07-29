import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Vehicle, Driver, VehicleBooking, MaintenanceRecord, BookingStatus } from '../types/fleet.types';

interface FleetContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: VehicleBooking[];
  maintenanceRecords: MaintenanceRecord[];
  addVehicle: (v: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  addDriver: (d: Omit<Driver, 'id'>) => Promise<void>;
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  addBooking: (b: Omit<VehicleBooking, 'id' | 'status'>) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus, extra?: Partial<VehicleBooking>) => Promise<void>;
  addMaintenance: (m: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
  checkAvailability: (vehicleId: string, fromDate: string, toDate: string, excludeBookingId?: string) => boolean;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('fms_vehicles');
    return saved ? JSON.parse(saved) : [];
  });
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('fms_drivers');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookings, setBookings] = useState<VehicleBooking[]>(() => {
    const saved = localStorage.getItem('fms_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('fms_maintenance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fms_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('fms_drivers', JSON.stringify(drivers));
    localStorage.setItem('fms_bookings', JSON.stringify(bookings));
    localStorage.setItem('fms_maintenance', JSON.stringify(maintenanceRecords));
  }, [vehicles, drivers, bookings, maintenanceRecords]);

  // Mock DB load for now (since no Supabase tables exist until user runs migration)
  // To keep it simple, we'll rely on localStorage. If you want full realtime, 
  // we would add supabase listeners here similar to VisitorContext.

  const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
    const newV = { ...v, id: crypto.randomUUID() };
    setVehicles(prev => [newV, ...prev]);
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const addDriver = async (d: Omit<Driver, 'id'>) => {
    const newD = { ...d, id: crypto.randomUUID() };
    setDrivers(prev => [newD, ...prev]);
  };

  const updateDriver = async (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const checkAvailability = (vehicleId: string, fromDate: string, toDate: string, excludeBookingId?: string) => {
    const requestedStart = new Date(fromDate).getTime();
    const requestedEnd = new Date(toDate).getTime();
    
    // Find any overlapping bookings that are APPROVED, DISPATCHED, or ON_TRIP
    const conflicting = bookings.filter(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.vehicleId !== vehicleId) return false;
      if (b.status === 'REJECTED' || b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;
      
      const bStart = new Date(b.fromDate).getTime();
      const bEnd = new Date(b.toDate).getTime();

      // Check overlap
      return (requestedStart < bEnd && requestedEnd > bStart);
    });

    return conflicting.length === 0;
  };

  const addBooking = async (b: Omit<VehicleBooking, 'id' | 'status'>) => {
    if (!checkAvailability(b.vehicleId, b.fromDate, b.toDate)) {
      throw new Error('Vehicle is already booked during this time period.');
    }

    const newB: VehicleBooking = { ...b, id: crypto.randomUUID(), status: 'PENDING' };
    setBookings(prev => [newB, ...prev]);
  };

  const updateBookingStatus = async (id: string, status: BookingStatus, extra?: Partial<VehicleBooking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, ...extra } : b));
    
    // Sync vehicle status if dispatching or completing
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      if (status === 'DISPATCHED') {
        updateVehicle(booking.vehicleId, { status: 'BOOKED' }); // "On Trip" basically
        if (booking.driverId) updateDriver(booking.driverId, { status: 'ON_TRIP' });
      } else if (status === 'COMPLETED') {
        updateVehicle(booking.vehicleId, { status: 'AVAILABLE', currentKm: extra?.endKm || booking.estimatedKm });
        if (booking.driverId) updateDriver(booking.driverId, { status: 'AVAILABLE' });
      } else if (status === 'APPROVED') {
        updateVehicle(booking.vehicleId, { status: 'RESERVED' });
      } else if (status === 'CANCELLED' || status === 'REJECTED') {
         // Revert vehicle to available if it was reserved
         updateVehicle(booking.vehicleId, { status: 'AVAILABLE' });
      }
    }
  };

  const addMaintenance = async (m: Omit<MaintenanceRecord, 'id'>) => {
    const newM = { ...m, id: crypto.randomUUID() };
    setMaintenanceRecords(prev => [newM, ...prev]);
  };

  return (
    <FleetContext.Provider value={{
      vehicles, drivers, bookings, maintenanceRecords,
      addVehicle, updateVehicle, addDriver, updateDriver,
      addBooking, updateBookingStatus, addMaintenance, checkAvailability
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
};
