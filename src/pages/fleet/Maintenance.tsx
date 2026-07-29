import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import type { MaintenanceRecord } from '../../types/fleet.types';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const Maintenance: React.FC = () => {
  const { maintenanceRecords, vehicles, addMaintenance } = useFleet();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    vehicleId: '',
    type: 'SERVICE',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    vendor: '',
    description: '',
    kmReading: 0
  });

  const handleSave = () => {
    addMaintenance(formData as Omit<MaintenanceRecord, 'id'>);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Maintenance Records</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Track vehicle servicing and repairs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} />}>
          Log Maintenance
        </Button>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No maintenance records found
                  </TableCell>
                </TableRow>
              ) : (
                maintenanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
                  const vehicle = vehicles.find(v => v.id === record.vehicleId);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>{vehicle?.vehicleName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicle?.registrationNumber}</div>
                      </TableCell>
                      <TableCell><Badge variant="default">{record.type}</Badge></TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.vendor}</TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: 500 }}>₹{record.cost.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Maintenance Record"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Record</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Select Vehicle</label>
            <select className="ui-input" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNumber} - {v.vehicleName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
            <select className="ui-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              <option value="SERVICE">Regular Service</option>
              <option value="REPAIR">Repair / Breakdown</option>
              <option value="TYRE">Tyre Replacement</option>
              <option value="BATTERY">Battery Replacement</option>
              <option value="OIL">Oil Change</option>
              <option value="INSURANCE">Insurance Renewal</option>
              <option value="PUC">PUC Renewal</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Date</label>
            <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Cost (₹)</label>
            <Input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>KM Reading</label>
            <Input type="number" value={formData.kmReading} onChange={e => setFormData({...formData, kmReading: parseInt(e.target.value)})} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Vendor / Service Center</label>
            <Input value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details of work done" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
