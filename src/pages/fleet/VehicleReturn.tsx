import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Download, AlertTriangle, ShieldAlert } from 'lucide-react';

export const VehicleReturn: React.FC = () => {
  const { bookings, vehicles, updateBookingStatus } = useFleet();
  
  const activeTrips = bookings.filter(b => b.status === 'DISPATCHED');

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [returnForm, setReturnForm] = useState({
    endKm: 0,
    endFuelLevel: 'HALF',
    damageReported: false,
    returnRemarks: ''
  });

  const handleOpenReturn = (bookingId: string, currentKm: number) => {
    setSelectedBookingId(bookingId);
    setReturnForm({
      endKm: currentKm,
      endFuelLevel: 'HALF',
      damageReported: false,
      returnRemarks: ''
    });
    setReturnModalOpen(true);
  };

  const handleReturn = () => {
    if (!selectedBookingId) return;

    updateBookingStatus(selectedBookingId, 'COMPLETED', {
      endKm: returnForm.endKm,
      endFuelLevel: returnForm.endFuelLevel as any,
      damageReported: returnForm.damageReported,
      returnRemarks: returnForm.returnRemarks,
      returnTime: new Date().toISOString()
    });

    setReturnModalOpen(false);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Vehicle Return & Inspection</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Complete trips and log end-of-trip details</p>
      </div>

      {activeTrips.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No vehicles are currently out.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {activeTrips.map(trip => {
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            return (
              <Card key={trip.id}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{vehicle?.vehicleName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{vehicle?.registrationNumber}</div>
                    </div>
                    <Badge variant="info">On Trip</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Start KM</div>
                      <div style={{ fontWeight: 500 }}>{trip.startKm}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Passenger</div>
                      <div style={{ fontWeight: 500 }}>{trip.employeeName}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Destination</div>
                      <div style={{ fontWeight: 500 }}>{trip.visitLocation}</div>
                    </div>
                  </div>

                  <Button 
                    style={{ width: '100%', backgroundColor: 'var(--success-color)' }} 
                    onClick={() => handleOpenReturn(trip.id, trip.startKm || vehicle?.currentKm || 0)} 
                    leftIcon={<Download size={16} />}
                  >
                    Check-in Vehicle
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Vehicle Return Checklist"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReturn} style={{ backgroundColor: 'var(--success-color)' }} leftIcon={<Download size={16} />}>Complete Trip</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Ending KM Reading</label>
            <Input type="number" value={returnForm.endKm} onChange={e => setReturnForm({...returnForm, endKm: parseInt(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Return Fuel Level</label>
            <select className="ui-input" value={returnForm.endFuelLevel} onChange={e => setReturnForm({...returnForm, endFuelLevel: e.target.value})}>
              <option value="FULL">Full</option>
              <option value="THREE_QUARTER">3/4 Tank</option>
              <option value="HALF">Half Tank</option>
              <option value="QUARTER">1/4 Tank</option>
              <option value="EMPTY">Empty</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: returnForm.damageReported ? 'var(--danger-color)10' : 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: returnForm.damageReported ? '1px solid var(--danger-color)30' : '1px solid transparent' }}>
            <input type="checkbox" id="damageReported" checked={returnForm.damageReported} onChange={e => setReturnForm({...returnForm, damageReported: e.target.checked})} />
            <label htmlFor="damageReported" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <AlertTriangle size={16} style={{ color: returnForm.damageReported ? 'var(--danger-color)' : 'inherit' }} />
              Report Damage / Issues
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Return Remarks</label>
            <Input value={returnForm.returnRemarks} onChange={e => setReturnForm({...returnForm, returnRemarks: e.target.value})} placeholder={returnForm.damageReported ? "Please detail the damage here..." : "e.g. All okay"} />
          </div>

          {returnForm.damageReported && (
            <div style={{ fontSize: '0.75rem', color: 'var(--danger-color)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              Reporting damage will flag this vehicle for maintenance and notify the Fleet Manager.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
