export type VehicleStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RESERVED' | 'IN_TRANSIT' | 'RETURNED' | 'BREAKDOWN';
export type VehicleType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'PICKUP' | 'TRUCK' | 'BUS' | 'VAN' | 'AMBULANCE' | 'FIRE_TENDER' | 'MOTORCYCLE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'LEAVE' | 'INACTIVE';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  vehicleType: VehicleType;
  manufacturer?: string;
  model?: string;
  department: string;
  fuelType: 'PETROL' | 'DIESEL' | 'EV' | 'CNG';
  transmission: 'MANUAL' | 'AUTOMATIC';
  seatingCapacity: number;
  currentKm: number;
  purchaseDate: string;
  insuranceExpiry: string;
  pucExpiry: string;
  fitnessCertificateDate?: string;
  serviceDueKm: number;
  status: VehicleStatus;
  remarks: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  mobile: string;
  department: string;
  experienceYears: number;
  assignedVehicleId?: string;
  status: DriverStatus;
}

export interface VehicleBooking {
  id: string;
  vehicleId: string;
  department: string;
  employeeName: string;
  purpose: string;
  project?: string;
  visitLocation: string;
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
  estimatedKm: number;
  passengers: number;
  needDriver: boolean;
  driverId?: string; // assigned later or self
  employeeLicenseNumber?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  remarks: string;
  status: BookingStatus;
  approvedBy?: string;
  approvalTime?: string;
  
  // Dispatch details
  startKm?: number;
  startFuelLevel?: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  dispatchTime?: string;
  dispatchRemarks?: string;

  // Return details
  endKm?: number;
  endFuelLevel?: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  returnTime?: string;
  returnRemarks?: string;
  damageReported?: boolean;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'SERVICE' | 'REPAIR' | 'TYRE' | 'BATTERY' | 'OIL' | 'BRAKE' | 'INSURANCE' | 'PUC';
  date: string;
  cost: number;
  vendor: string;
  description: string;
  kmReading: number;
}
