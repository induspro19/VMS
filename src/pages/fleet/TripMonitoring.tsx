import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Navigation, MapPin, User, Clock, Phone } from 'lucide-react';

export const TripMonitoring: React.FC = () => {
  const { bookings, vehicles, drivers } = useFleet();
  
  const activeTrips = bookings.filter(b => b.status === 'DISPATCHED');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Live Trip Monitoring</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Track vehicles currently on trip</p>
      </div>

      {activeTrips.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No vehicles are currently on a trip.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {activeTrips.map(trip => {
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            const driver = drivers.find(d => d.id === trip.driverId);
            
            return (
              <Card key={trip.id}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--info-color)20', borderRadius: '50%', color: 'var(--info-color)' }}>
                        <Navigation size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{vehicle?.vehicleName}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{vehicle?.registrationNumber}</div>
                      </div>
                    </div>
                    <Badge variant="info" style={{ animation: 'pulse 2s infinite' }}>On Route</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <User size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Booked By</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{trip.employeeName} ({trip.department})</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Passengers</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{trip.passengers}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <MapPin size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Destination</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{trip.visitLocation}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expected Duration</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {trip.fromTime} - {trip.toTime}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Driver</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{driver ? driver.name : (trip.needDriver ? 'Pending Assignment' : 'Self Drive')}</div>
                      </div>
                      {driver && (
                        <a href={`tel:${driver.mobile}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                          <Phone size={14} /> Call Driver
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
