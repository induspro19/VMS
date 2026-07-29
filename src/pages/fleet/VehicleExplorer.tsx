import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useAuth } from '../../context/AuthContext';
import type { VehicleType, VehicleStatus } from '../../types/fleet.types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Calendar, PenTool as Tool, Search, Info } from 'lucide-react';

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

const statusColors: Record<VehicleStatus, string> = {
  AVAILABLE: 'var(--success-color)',
  BOOKED: 'var(--info-color)',
  MAINTENANCE: 'var(--warning-color)',
  OUT_OF_SERVICE: 'var(--danger-color)',
  RESERVED: 'var(--primary-color)',
  IN_TRANSIT: 'var(--info-color)',
  RETURNED: 'var(--success-color)',
  BREAKDOWN: 'var(--danger-color)'
};

export const VehicleExplorer: React.FC = () => {
  const { vehicles, bookings, addBooking } = useFleet();
  const { user } = useAuth();
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(vehicles.length > 0 ? vehicles[0].id : null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<VehicleType | 'ALL'>('ALL');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [bookingForm, setBookingForm] = useState({
    purpose: '',
    visitLocation: '',
    priority: 'NORMAL',
    fromTime: '09:00',
    toTime: '18:00',
    estimatedKm: 0,
    passengers: 1,
    needDriver: true,
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Derived state
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
  
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) || 
                          v.vehicleName.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || v.vehicleType === filterType;
      return matchSearch && matchType;
    });
  }, [vehicles, search, filterType]);

  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicleType)));

  // Calendar logic (next 30 days)
  const today = new Date();
  const calendarDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const getDayStatus = (vehicleId: string, date: string): 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'PAST' => {
    if (new Date(date) < new Date(today.toISOString().split('T')[0])) return 'PAST';

    // In reality, check maintenance schedules here. For now, check if vehicle is currently in maintenance.
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.status === 'MAINTENANCE') return 'MAINTENANCE';

    const dayBookings = bookings.filter(b => 
      b.vehicleId === vehicleId && 
      b.status !== 'REJECTED' && 
      b.status !== 'CANCELLED' &&
      b.fromDate <= date && 
      b.toDate >= date
    );

    if (dayBookings.length > 0) return 'BOOKED';
    return 'AVAILABLE';
  };

  const handleDayClick = (date: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    setSelectedDate(date);
    setError(null);
    setBookingModalOpen(true);
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
        fromDate: selectedDate,
        toDate: selectedDate, // Simplified: single day booking from calendar
        fromTime: bookingForm.fromTime,
        toTime: bookingForm.toTime,
        estimatedKm: bookingForm.estimatedKm,
        passengers: bookingForm.passengers,
        needDriver: bookingForm.needDriver,
        priority: bookingForm.priority as any,
        remarks: bookingForm.remarks
      });
      setBookingModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to book vehicle');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      
      {/* MODULE 1 & 2: Vehicle Ribbon */}
      <div style={{ padding: '1.5rem 1.5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Vehicle Explorer</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Select a vehicle to view details and availability</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <Input 
                placeholder="Search Reg No or Name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.875rem' }}
              />
            </div>
            <select 
              className="ui-input" 
              style={{ height: '36px', width: '150px', fontSize: '0.875rem' }}
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
            >
              <option value="ALL">All Types</option>
              {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Horizontal Scroll Ribbon */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem',
          scrollbarWidth: 'thin'
        }}>
          {filteredVehicles.map(vehicle => {
            let dotColor = '#10B981'; // Green (Available)
            if (vehicle.status === 'BOOKED' || vehicle.status === 'IN_TRANSIT' || vehicle.status === 'RESERVED') {
              dotColor = '#F59E0B'; // Orange (Booked)
            } else if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE' || vehicle.status === 'BREAKDOWN') {
              dotColor = '#EF4444'; // Red (Maintenance)
            }

            return (
              <Card 
                key={vehicle.id} 
                onClick={() => setSelectedVehicleId(vehicle.id)}
                style={{ 
                  minWidth: '170px',
                  height: '90px',
                  cursor: 'pointer',
                  border: selectedVehicleId === vehicle.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: selectedVehicleId === vehicle.id ? 'var(--bg-selected)' : 'var(--bg-card)',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <CardContent style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} title={vehicle.status} />
                  <img src={vehicleIcons[vehicle.vehicleType]} alt={vehicle.vehicleType} style={{ height: '32px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{vehicle.registrationNumber}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{vehicle.vehicleName}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* MODULE 4 & 5: Vehicle Details and Calendar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-main)' }}>
        {selectedVehicle ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Left Column: Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ width: '120px', height: '80px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <img src={vehicleIcons[selectedVehicle.vehicleType]} alt="vehicle" style={{ height: '60px' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{selectedVehicle.vehicleName}</h2>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 600, backgroundColor: 'var(--bg-input)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          {selectedVehicle.registrationNumber}
                        </div>
                        <Badge variant="default">{selectedVehicle.vehicleType}</Badge>
                        <Badge style={{ backgroundColor: statusColors[selectedVehicle.status], color: '#fff' }}>{selectedVehicle.status}</Badge>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <DetailItem label="Manufacturer" value={selectedVehicle.manufacturer || 'Unknown'} />
                    <DetailItem label="Model" value={selectedVehicle.model || 'Unknown'} />
                    <DetailItem label="Department" value={selectedVehicle.department} />
                    
                    <DetailItem label="Fuel Type / %" value={`${selectedVehicle.fuelType} (Simulated: 75%)`} />
                    <DetailItem label="Transmission" value={selectedVehicle.transmission} />
                    <DetailItem label="Seating Capacity" value={`${selectedVehicle.seatingCapacity} Passengers`} />
                    
                    <DetailItem label="Current Odometer" value={`${(selectedVehicle.currentKm || 0).toLocaleString()} km`} />
                    <DetailItem label="Next Service Due" value={`${(selectedVehicle.serviceDueKm || 0).toLocaleString()} km`} />
                    <DetailItem label="Current Location" value="Base Parking (Simulated)" />
                    
                    <DetailItem label="Insurance Validity" value={new Date(selectedVehicle.insuranceExpiry).toLocaleDateString()} />
                    <DetailItem label="PUC Certificate" value={new Date(selectedVehicle.pucExpiry).toLocaleDateString()} />
                    <DetailItem label="Fitness Certificate" value={selectedVehicle.fitnessCertificateDate ? new Date(selectedVehicle.fitnessCertificateDate).toLocaleDateString() : 'N/A'} />
                  </div>
                </CardContent>
              </Card>

              {/* Remarks/Status Warning if any */}
              {selectedVehicle.status === 'MAINTENANCE' && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--warning-color)10', border: '1px solid var(--warning-color)30', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Tool style={{ color: 'var(--warning-color)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Vehicle Under Maintenance</div>
                    <div style={{ fontSize: '0.875rem' }}>This vehicle cannot be booked until released by the fleet manager.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Calendar */}
            <Card style={{ position: 'sticky', top: '1.5rem' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} /> Availability Board
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click an available date to book</p>
              </div>
              <CardContent style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.75rem' }}>
                  <LegendItem color="var(--success-color)" label="Available" />
                  <LegendItem color="var(--warning-color)" label="Booked" />
                  <LegendItem color="var(--danger-color)" label="Maintenance" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{d}</div>
                  ))}
                  
                  {/* Fill empty days for first week (simplified calculation) */}
                  {Array.from({ length: new Date(calendarDays[0]).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

                  {calendarDays.map(date => {
                    const status = getDayStatus(selectedVehicle.id, date);
                    const isAvailable = status === 'AVAILABLE';
                    const dayNum = new Date(date).getDate();
                    
                    let bg = 'transparent';
                    let border = '1px solid var(--border-color)';
                    let color = 'var(--text-primary)';
                    
                    if (status === 'AVAILABLE') { bg = 'var(--success-color)10'; border = '1px solid var(--success-color)50'; color = 'var(--success-color)'; }
                    if (status === 'BOOKED') { bg = 'var(--warning-color)20'; border = '1px solid transparent'; color = 'var(--warning-color)'; }
                    if (status === 'MAINTENANCE') { bg = 'var(--danger-color)20'; border = '1px solid transparent'; color = 'var(--danger-color)'; }
                    if (status === 'PAST') { color = 'var(--text-muted)'; border = '1px dashed var(--border-color)'; }

                    return (
                      <button
                        key={date}
                        onClick={() => handleDayClick(date, status)}
                        disabled={!isAvailable}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          backgroundColor: bg,
                          border: border,
                          color: color,
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          padding: 0
                        }}
                        title={`${date} - ${status}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Info size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Select a vehicle from the ribbon above to view details.</p>
          </div>
        )}
      </div>

      {/* MODULE 6: Booking Form Modal */}
      <Modal 
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Vehicle Booking Request"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBook}>Submit Request</Button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Selected Vehicle</div>
            <div style={{ fontWeight: 600 }}>{selectedVehicle?.vehicleName} ({selectedVehicle?.registrationNumber})</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</div>
            <div style={{ fontWeight: 600 }}>{new Date(selectedDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Destination</label>
            <Input value={bookingForm.visitLocation} onChange={e => setBookingForm({...bookingForm, visitLocation: e.target.value})} placeholder="e.g. Client Office, Downtown" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Purpose</label>
            <Input value={bookingForm.purpose} onChange={e => setBookingForm({...bookingForm, purpose: e.target.value})} placeholder="Reason for travel" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Start Time</label>
            <Input type="time" value={bookingForm.fromTime} onChange={e => setBookingForm({...bookingForm, fromTime: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Expected Return</label>
            <Input type="time" value={bookingForm.toTime} onChange={e => setBookingForm({...bookingForm, toTime: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Passengers</label>
            <Input type="number" min={1} max={selectedVehicle?.seatingCapacity || 10} value={bookingForm.passengers} onChange={e => setBookingForm({...bookingForm, passengers: parseInt(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Priority</label>
            <select className="ui-input" value={bookingForm.priority} onChange={e => setBookingForm({...bookingForm, priority: e.target.value})}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Driver Required?</label>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type="radio" name="driver" checked={bookingForm.needDriver} onChange={() => setBookingForm({...bookingForm, needDriver: true})} />
                Yes, assign a driver
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type="radio" name="driver" checked={!bookingForm.needDriver} onChange={() => setBookingForm({...bookingForm, needDriver: false})} />
                No, self drive
              </label>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Remarks</label>
            <Input value={bookingForm.remarks} onChange={e => setBookingForm({...bookingForm, remarks: e.target.value})} placeholder="Any special requirements..." />
          </div>
        </div>
      </Modal>

    </div>
  );
};

// Helper Components
const DetailItem = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
  </div>
);

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
    <div style={{ width: '8px', height: '8px', backgroundColor: color, borderRadius: '50%' }} />
    {label}
  </div>
);
