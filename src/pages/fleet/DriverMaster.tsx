import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import type { Driver } from '../../types/fleet.types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, Search, User } from 'lucide-react';

export const DriverMaster: React.FC = () => {
  const { drivers, addDriver, updateDriver } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '',
    licenseNumber: '',
    mobile: '',
    department: '',
    experienceYears: 0,
    status: 'AVAILABLE'
  });

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingId(driver.id);
      setFormData(driver);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        licenseNumber: '',
        mobile: '',
        department: '',
        experienceYears: 0,
        status: 'AVAILABLE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateDriver(editingId, formData);
    } else {
      addDriver(formData as Omit<Driver, 'id'>);
    }
    setIsModalOpen(false);
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.mobile.includes(searchTerm)
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Driver Master</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Manage the enterprise drivers and availability</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
          Add Driver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <Input 
              placeholder="Search drivers..." 
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
                <TableHead>Driver Name</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div style={{ fontWeight: 500 }}>{d.name}</div>
                      </div>
                    </TableCell>
                    <TableCell><div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.licenseNumber}</div></TableCell>
                    <TableCell>{d.mobile}</TableCell>
                    <TableCell>{d.experienceYears} Years</TableCell>
                    <TableCell>{d.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        d.status === 'AVAILABLE' ? 'success' :
                        d.status === 'ON_TRIP' ? 'info' :
                        d.status === 'LEAVE' ? 'warning' : 'danger'
                      }>
                        {d.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(d)}>
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
        title={editingId ? 'Edit Driver' : 'Add New Driver'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Driver</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Driver Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Mobile Number</label>
            <Input 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})}
              placeholder="e.g. +91 9876543210"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>License Number</label>
            <Input 
              value={formData.licenseNumber} 
              onChange={e => setFormData({...formData, licenseNumber: e.target.value.toUpperCase()})}
              placeholder="e.g. MH-12-123456789"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Experience (Years)</label>
            <Input 
              type="number"
              value={formData.experienceYears} 
              onChange={e => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Department</label>
            <Input 
              value={formData.department} 
              onChange={e => setFormData({...formData, department: e.target.value})}
              placeholder="e.g. Executive Staff"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
            <select 
              className="ui-input"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
