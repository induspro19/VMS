import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle, VehicleType } from '../../types/fleet.types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

const vehicleIcons: Record<VehicleType, string> = {
  SEDAN: '/src/assets/vehicles/sedan.svg',
  SUV: '/src/assets/vehicles/suv.svg',
  HATCHBACK: '/src/assets/vehicles/hatchback.svg',
  PICKUP: '/src/assets/vehicles/pickup.svg',
  TRUCK: '/src/assets/vehicles/truck.svg',
  BUS: '/src/assets/vehicles/bus.svg',
  VAN: '/src/assets/vehicles/van.svg',
  AMBULANCE: '/src/assets/vehicles/ambulance.svg',
  FIRE_TENDER: '/src/assets/vehicles/fire-tender.svg',
  MOTORCYCLE: '/src/assets/vehicles/motorcycle.svg'
};

export const BookingDashboard: React.FC = () => {
  const { vehicles, addBooking } = useFleet();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<VehicleType | 'ALL'>('ALL');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [bookingForm, setBookingForm] = useState({
    purpose: '',
    visitLocation: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    fromTime: '09:00',
    toTime: '18:00',
    estimatedKm: 0,
    passengers: 1,
    needDriver: true,
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);

  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicleType)));

  const filteredVehicles = selectedType === 'ALL' 
    ? vehicles 
    : vehicles.filter(v => v.vehicleType === selectedType);

  const handleOpenBooking = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setError(null);
    setIsBookingModalOpen(true);
  };

  const handleBook = async () => {
    if (!selectedVehicle || !user) return;
    
    try {
      await addBooking({
        vehicleId: selectedVehicle.id,
        department: user.department || 'General',
        employeeName: user.name,
        purpose: bookingForm.purpose,
        visitLocation: bookingForm.visitLocation,
        fromDate: bookingForm.fromDate,
        toDate: bookingForm.toDate,
        fromTime: bookingForm.fromTime,
        toTime: bookingForm.toTime,
        estimatedKm: bookingForm.estimatedKm,
        passengers: bookingForm.passengers,
        needDriver: bookingForm.needDriver,
        remarks: bookingForm.remarks
      });
      setIsBookingModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to book vehicle');
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Vehicle Booking</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Select and book an available vehicle</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button 
          className={`ui-badge ${selectedType === 'ALL' ? 'ui-badge-primary' : 'ui-badge-default'}`}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', fontWeight: 600 }}
          onClick={() => setSelectedType('ALL')}
        >
          All Types
        </button>
        {vehicleTypes.map(type => (
          <button 
            key={type}
            className={`ui-badge ${selectedType === type ? 'ui-badge-primary' : 'ui-badge-default'}`}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', fontWeight: 600 }}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredVehicles.map(vehicle => (
          <Card key={vehicle.id} style={{ overflow: 'hidden', border: vehicle.status === 'AVAILABLE' ? '1px solid var(--success-color)30' : '1px solid var(--border-color)' }}>
            <CardContent style={{ padding: 0 }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <img src={vehicleIcons[vehicle.vehicleType]} alt={vehicle.vehicleType} style={{ width: '120px', height: '80px', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <Badge variant={
                    vehicle.status === 'AVAILABLE' ? 'success' :
                    vehicle.status === 'BOOKED' || vehicle.status === 'RESERVED' ? 'info' :
                    vehicle.status === 'MAINTENANCE' ? 'warning' : 'danger'
                  }>
                    {vehicle.status}
                  </Badge>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>{vehicle.vehicleName}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{vehicle.registrationNumber}</div>
                  </div>
                  <Badge variant="default">{vehicle.fuelType}</Badge>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div>💺 {vehicle.seatingCapacity} Seats</div>
                  <div>⚙️ {vehicle.transmission === 'MANUAL' ? 'MT' : 'AT'}</div>
                </div>

                <Button 
                  style={{ width: '100%' }} 
                  disabled={vehicle.status !== 'AVAILABLE'}
                  onClick={() => handleOpenBooking(vehicle)}
                >
                  {vehicle.status === 'AVAILABLE' ? 'Book Now' : 'Not Available'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Book Vehicle"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBook}>Submit Request</Button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        {selectedVehicle && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={vehicleIcons[selectedVehicle.vehicleType]} alt="Vehicle" style={{ width: '40px' }} />
            <div>
              <div style={{ fontWeight: 600 }}>{selectedVehicle.vehicleName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{selectedVehicle.registrationNumber}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Destination / Location</label>
            <Input value={bookingForm.visitLocation} onChange={e => setBookingForm({...bookingForm, visitLocation: e.target.value})} placeholder="Where are you going?" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Purpose</label>
            <Input value={bookingForm.purpose} onChange={e => setBookingForm({...bookingForm, purpose: e.target.value})} placeholder="Reason for booking" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>From Date</label>
            <Input type="date" value={bookingForm.fromDate} onChange={e => setBookingForm({...bookingForm, fromDate: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>To Date</label>
            <Input type="date" value={bookingForm.toDate} onChange={e => setBookingForm({...bookingForm, toDate: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>From Time</label>
            <Input type="time" value={bookingForm.fromTime} onChange={e => setBookingForm({...bookingForm, fromTime: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>To Time</label>
            <Input type="time" value={bookingForm.toTime} onChange={e => setBookingForm({...bookingForm, toTime: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Passengers</label>
            <Input type="number" min={1} max={selectedVehicle?.seatingCapacity || 10} value={bookingForm.passengers} onChange={e => setBookingForm({...bookingForm, passengers: parseInt(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Estimated Km</label>
            <Input type="number" value={bookingForm.estimatedKm} onChange={e => setBookingForm({...bookingForm, estimatedKm: parseInt(e.target.value)})} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="needDriver" checked={bookingForm.needDriver} onChange={e => setBookingForm({...bookingForm, needDriver: e.target.checked})} />
            <label htmlFor="needDriver" style={{ fontSize: '0.875rem' }}>Require a designated driver</label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
