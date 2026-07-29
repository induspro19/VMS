import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import type { Vehicle, VehicleType } from '../../types/fleet.types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, Search } from 'lucide-react';

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

export const VehicleMaster: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    registrationNumber: '',
    vehicleName: '',
    vehicleType: 'SEDAN',
    department: '',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    seatingCapacity: 4,
    currentKm: 0,
    status: 'AVAILABLE'
  });

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setFormData(vehicle);
    } else {
      setEditingId(null);
      setFormData({
        registrationNumber: '',
        vehicleName: '',
        vehicleType: 'SEDAN',
        department: '',
        fuelType: 'PETROL',
        transmission: 'MANUAL',
        seatingCapacity: 4,
        currentKm: 0,
        status: 'AVAILABLE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateVehicle(editingId, formData);
    } else {
      addVehicle(formData as Omit<Vehicle, 'id'>);
    }
    setIsModalOpen(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Vehicle Master</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Manage the enterprise vehicle inventory</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <Input 
              placeholder="Search vehicles..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Km Reading</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={vehicleIcons[v.vehicleType]} alt={v.vehicleType} style={{ width: '32px', height: '32px' }} />
                        </div>
                        <div style={{ fontWeight: 500 }}>{v.vehicleName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{v.vehicleType}</TableCell>
                    <TableCell><div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.registrationNumber}</div></TableCell>
                    <TableCell>{v.department || '-'}</TableCell>
                    <TableCell>{v.currentKm?.toLocaleString() || 0} km</TableCell>
                    <TableCell>
                      <Badge variant={
                        v.status === 'AVAILABLE' ? 'success' :
                        v.status === 'BOOKED' || v.status === 'RESERVED' ? 'info' :
                        v.status === 'MAINTENANCE' ? 'warning' : 'danger'
                      }>
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(v)}>
                        <Edit2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Vehicle</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Registration Number</label>
            <Input 
              value={formData.registrationNumber} 
              onChange={e => setFormData({...formData, registrationNumber: e.target.value.toUpperCase()})}
              placeholder="e.g. MH-12-AB-1234"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Vehicle Name</label>
            <Input 
              value={formData.vehicleName} 
              onChange={e => setFormData({...formData, vehicleName: e.target.value})}
              placeholder="e.g. Innova Crysta"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Vehicle Type</label>
            <select 
              className="ui-input"
              value={formData.vehicleType}
              onChange={e => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
            >
              {Object.keys(vehicleIcons).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Department</label>
            <Input 
              value={formData.department} 
              onChange={e => setFormData({...formData, department: e.target.value})}
              placeholder="e.g. Logistics"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Fuel Type</label>
            <select 
              className="ui-input"
              value={formData.fuelType}
              onChange={e => setFormData({...formData, fuelType: e.target.value as any})}
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="EV">Electric (EV)</option>
              <option value="CNG">CNG</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
            <select 
              className="ui-input"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="RESERVED">Reserved</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="BREAKDOWN">Breakdown</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
