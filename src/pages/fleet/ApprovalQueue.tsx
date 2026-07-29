import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Check, X, Calendar, MapPin, User, Clock, AlertTriangle } from 'lucide-react';

export const ApprovalQueue: React.FC = () => {
  const { bookings, vehicles, updateBookingStatus } = useFleet();

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  const handleApprove = (id: string) => {
    updateBookingStatus(id, 'APPROVED');
  };

  const handleReject = (id: string) => {
    updateBookingStatus(id, 'REJECTED');
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Approval Queue</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Review and approve pending vehicle requests</p>
      </div>

      {pendingBookings.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Check size={48} style={{ color: 'var(--success-color)', opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>All caught up!</h3>
            <p style={{ margin: 0 }}>There are no pending booking requests at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pendingBookings.map(booking => {
            const vehicle = vehicles.find(v => v.id === booking.vehicleId);
            return (
              <Card key={booking.id}>
                <CardContent style={{ display: 'flex', gap: '2rem', padding: '1.5rem' }}>
                  
                  {/* Left Column - Request Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={24} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{booking.employeeName}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{booking.department}</div>
                        </div>
                      </div>
                      <Badge variant="warning">Pending Approval</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <MapPin size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Destination</div>
                          <div style={{ fontWeight: 500 }}>{booking.visitLocation}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dates</div>
                          <div style={{ fontWeight: 500 }}>{booking.fromDate} to {booking.toDate}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time</div>
                          <div style={{ fontWeight: 500 }}>{booking.fromTime} - {booking.toTime}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <User size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Details</div>
                          <div style={{ fontWeight: 500 }}>{booking.passengers} Passengers • {booking.needDriver ? 'Need Driver' : 'Self Drive'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <AlertTriangle size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Priority</div>
                          <div style={{ fontWeight: 500, color: booking.priority === 'URGENT' ? 'var(--danger-color)' : booking.priority === 'HIGH' ? 'var(--warning-color)' : 'inherit' }}>{booking.priority || 'NORMAL'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Vehicle & Actions */}
                  <div style={{ width: '300px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Requested Vehicle</div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{vehicle?.vehicleName}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{vehicle?.registrationNumber}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                      <Button variant="outline" style={{ flex: 1, color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => handleReject(booking.id)} leftIcon={<X size={16} />}>
                        Reject
                      </Button>
                      <Button style={{ flex: 1, backgroundColor: 'var(--success-color)' }} onClick={() => handleApprove(booking.id)} leftIcon={<Check size={16} />}>
                        Approve
                      </Button>
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
