import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Send, User, MapPin } from 'lucide-react';

export const TripDispatch: React.FC = () => {
  const { bookings, vehicles, drivers, updateBookingStatus } = useFleet();
  
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const approvedBookings = bookings.filter(b => b.status === 'APPROVED');

  const [dispatchForm, setDispatchForm] = useState({
    startKm: 0,
    startFuelLevel: 'HALF',
    driverId: '',
    dispatchRemarks: ''
  });

  const handleOpenDispatch = (id: string, vehicleKm: number) => {
    setSelectedBookingId(id);
    setDispatchForm({
      startKm: vehicleKm,
      startFuelLevel: 'HALF',
      driverId: '',
      dispatchRemarks: ''
    });
    setDispatchModalOpen(true);
  };

  const handleDispatch = () => {
    if (!selectedBookingId) return;
    
    updateBookingStatus(selectedBookingId, 'DISPATCHED', {
      startKm: dispatchForm.startKm,
      startFuelLevel: dispatchForm.startFuelLevel as any,
      driverId: dispatchForm.driverId || undefined,
      dispatchRemarks: dispatchForm.dispatchRemarks,
      dispatchTime: new Date().toISOString()
    });

    setDispatchModalOpen(false);
  };

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Trip Dispatch</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Assign drivers and dispatch approved vehicles</p>
      </div>

      {approvedBookings.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No vehicles waiting for dispatch.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {approvedBookings.map(booking => {
            const vehicle = vehicles.find(v => v.id === booking.vehicleId);
            return (
              <Card key={booking.id}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{vehicle?.vehicleName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{vehicle?.registrationNumber}</div>
                    </div>
                    <Badge variant="info">Ready</Badge>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <User size={16} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--text-secondary)' }}>For:</span> {booking.employeeName} ({booking.department})</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--text-secondary)' }}>To:</span> {booking.visitLocation}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Driver:</span> {booking.needDriver ? 'Required' : 'Self Drive'}
                    </div>
                  </div>

                  <Button style={{ width: '100%' }} onClick={() => handleOpenDispatch(booking.id, vehicle?.currentKm || 0)} leftIcon={<Send size={16} />}>
                    Dispatch Vehicle
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Dispatch Details"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDispatchModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDispatch} leftIcon={<Send size={16} />}>Confirm Dispatch</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Starting KM Reading</label>
            <Input type="number" value={dispatchForm.startKm} onChange={e => setDispatchForm({...dispatchForm, startKm: parseInt(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Fuel Level</label>
            <select className="ui-input" value={dispatchForm.startFuelLevel} onChange={e => setDispatchForm({...dispatchForm, startFuelLevel: e.target.value})}>
              <option value="FULL">Full</option>
              <option value="THREE_QUARTER">3/4 Tank</option>
              <option value="HALF">Half Tank</option>
              <option value="QUARTER">1/4 Tank</option>
              <option value="EMPTY">Empty</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Assign Driver</label>
            <select className="ui-input" value={dispatchForm.driverId} onChange={e => setDispatchForm({...dispatchForm, driverId: e.target.value})}>
              <option value="">-- No Driver (Self Drive) --</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Remarks/Condition</label>
            <Input value={dispatchForm.dispatchRemarks} onChange={e => setDispatchForm({...dispatchForm, dispatchRemarks: e.target.value})} placeholder="e.g. Clean, no dents" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
