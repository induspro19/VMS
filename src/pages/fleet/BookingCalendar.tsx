import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent } from '../../components/ui/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BookingCalendar: React.FC = () => {
  const { vehicles, bookings } = useFleet();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayStatus = (vehicleId: string, day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    
    const dayBookings = bookings.filter(b => 
      b.vehicleId === vehicleId && 
      b.status !== 'REJECTED' && 
      b.status !== 'CANCELLED' &&
      b.fromDate <= checkDate && 
      b.toDate >= checkDate
    );

    if (dayBookings.length === 0) return 'AVAILABLE';
    if (dayBookings.some(b => b.status === 'PENDING')) return 'PENDING';
    return 'BOOKED';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Booking Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Vehicle availability timeline</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
          <div style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <Card>
        <CardContent style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ minWidth: '800px' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ width: '200px', flexShrink: 0, padding: '1rem', fontWeight: 600, borderRight: '1px solid var(--border-color)' }}>
                Vehicle
              </div>
              <div style={{ display: 'flex', flex: 1 }}>
                {daysArray.map(day => (
                  <div key={day} style={{ flex: 1, minWidth: '30px', textAlign: 'center', padding: '1rem 0', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Rows */}
            {vehicles.map(vehicle => (
              <div key={vehicle.id} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '200px', flexShrink: 0, padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vehicle.vehicleName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicle.registrationNumber}</div>
                </div>
                <div style={{ display: 'flex', flex: 1, padding: '0.5rem 0' }}>
                  {daysArray.map(day => {
                    const status = getDayStatus(vehicle.id, day);
                    let bgColor = 'transparent';
                    if (status === 'AVAILABLE') bgColor = 'var(--success-color)20';
                    if (status === 'BOOKED') bgColor = 'var(--info-color)50';
                    if (status === 'PENDING') bgColor = 'var(--warning-color)50';

                    return (
                      <div key={day} style={{ flex: 1, minWidth: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ 
                          width: '100%', 
                          height: '24px', 
                          backgroundColor: bgColor,
                          margin: '0 2px',
                          borderRadius: '2px',
                          border: status === 'AVAILABLE' ? '1px dashed var(--success-color)50' : 'none'
                        }} title={`${day} - ${status}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: 'var(--success-color)20', border: '1px dashed var(--success-color)50' }} /> Available
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: 'var(--warning-color)50' }} /> Pending Approval
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: 'var(--info-color)50' }} /> Booked / On Trip
        </div>
      </div>
    </div>
  );
};
