import React, { useState, useRef, useEffect } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  ShieldCheck, CheckCircle, ArrowLeft, Sun, Globe, Clock,
  Phone, User, Building, Mail, Network, FileText, UserSquare, Car, 
  UserPlus, RefreshCw, X, ChevronDown, Calendar,
  Watch, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RegisterPortal.css';

export const RegisterPortal: React.FC = () => {
  const { registerVisitor, getVisitorHistory } = useVisitor();
  const { sendPush } = useNotification();
  const navigate = useNavigate();
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [time, setTime] = useState(new Date());

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    company: '',
    department: '',
    employeeToMeet: '',
    purpose: '',
  });

  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the first field on load
    if (mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null); // Clear error on typing
  };

  const handleMobileBlur = () => {
    if (formData.mobile.length >= 10) {
      const history = getVisitorHistory(formData.mobile);
      if (history.length > 0) {
        const lastVisit = history[0]; // Most recent visit
        setFormData(prev => ({
          ...prev,
          name: prev.name || lastVisit.name,
          company: prev.company || lastVisit.company,
          department: prev.department || lastVisit.department,
          employeeToMeet: prev.employeeToMeet || lastVisit.employeeToMeet,
          purpose: prev.purpose || lastVisit.purpose,
        }));
        setIsAutoFilled(true);
      }
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      mobile: '',
      company: '',
      department: '',
      employeeToMeet: '',
      purpose: '',
    });
    setIsAutoFilled(false);
    setError(null);
    if (mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.employeeToMeet) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.mobile.length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    try {
      registerVisitor(formData);
      
      // Simulate notification to employee
      sendPush(
        'New Visitor Request', 
        `${formData.name} from ${formData.company} is waiting for your approval.`
      );

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    }
  };

  if (submitted) {
    return (
      <div className="portal-kiosk-container animate-fade-in">
        <div className="portal-success-card">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h2>Registration Successful</h2>
          <p>Your details have been submitted. Please wait for employee approval.</p>
          <div className="status-badge">
            <div className="spinner"></div>
            <span>Status: Pending Approval</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-kiosk-container animate-fade-in">
      {/* Header */}
      <header className="portal-kiosk-header">
        <div className="kiosk-header-left">
          <button type="button" onClick={() => navigate(-1)} className="kiosk-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="kiosk-header-title-group">
            <ShieldCheck size={32} className="kiosk-header-logo" />
            <div className="kiosk-header-text">
              <h1>Enterprise Visitor Registration</h1>
              <p>Please complete the visitor information</p>
            </div>
          </div>
        </div>
        <div className="kiosk-header-right">
          <button type="button" className="kiosk-icon-btn"><Sun size={18} /></button>
          <button type="button" className="kiosk-icon-btn"><Clock size={18} /></button>
          <button type="button" className="kiosk-icon-btn"><Monitor size={18} /></button>
          <div className="kiosk-lang-selector">
            <Globe size={16} />
            English
            <ChevronDown size={14} style={{ marginLeft: '4px' }} />
          </div>
          <div className="kiosk-clock">
            <Clock size={16} />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="portal-kiosk-main">
        <form className="portal-kiosk-form-card" onSubmit={handleSubmit}>
          
          {error && (
            <div style={{ margin: '0 32px 16px', padding: '12px 16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '14px', border: '1px solid #F87171' }}>
              {error}
            </div>
          )}
          {isAutoFilled && !error && (
            <div style={{ margin: '0 32px 16px', padding: '12px 16px', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '10px', fontSize: '14px', border: '1px solid #4ADE80' }}>
              Welcome back! We've auto-filled your details from your last visit. Please verify and submit.
            </div>
          )}

          <div className="portal-kiosk-grid">
            {/* Mobile Number */}
            <div className="kiosk-form-group">
              <label>Mobile Number <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Phone size={18} /></div>
                <div className="kiosk-phone-prefix">
                  +91 <ChevronDown size={14} />
                </div>
                <input 
                  ref={mobileInputRef}
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleMobileBlur}
                  required
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="kiosk-form-group">
              <label>Full Name <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><User size={18} /></div>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="kiosk-form-group">
              <label>Company Name</label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Building size={18} /></div>
                <input 
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="kiosk-form-group">
              <label>Email Address</label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Mail size={18} /></div>
                <input 
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Department */}
            <div className="kiosk-form-group">
              <label>Department to Visit <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Network size={18} /></div>
                <div className="kiosk-select-wrapper">
                  <select name="department" value={formData.department} onChange={handleChange} required>
                    <option value="" disabled hidden>Select department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="HR">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Management">Management</option>
                  </select>
                  <ChevronDown size={16} className="kiosk-select-icon" />
                </div>
              </div>
            </div>

            {/* Host Employee */}
            <div className="kiosk-form-group">
              <label>Host / Employee <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><User size={18} /></div>
                <div className="kiosk-select-wrapper">
                  <select name="employeeToMeet" value={formData.employeeToMeet} onChange={handleChange} required>
                    <option value="" disabled hidden>Select host employee</option>
                    <option value="John Smith">John Smith</option>
                    <option value="Sarah Jane">Sarah Jane</option>
                  </select>
                  <ChevronDown size={16} className="kiosk-select-icon" />
                </div>
              </div>
            </div>

            {/* Purpose of Visit */}
            <div className="kiosk-form-group">
              <label>Purpose of Visit <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><FileText size={18} /></div>
                <div className="kiosk-select-wrapper">
                  <select name="purpose" value={formData.purpose} onChange={handleChange} required>
                    <option value="" disabled hidden>Select purpose</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                  <ChevronDown size={16} className="kiosk-select-icon" />
                </div>
              </div>
            </div>

            {/* Visitor Type */}
            <div className="kiosk-form-group">
              <label>Visitor Type <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><UserSquare size={18} /></div>
                <div className="kiosk-select-wrapper">
                  <select name="visitorType" required>
                    <option value="Guest">Guest</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                  <ChevronDown size={16} className="kiosk-select-icon" />
                </div>
              </div>
            </div>

            {/* Vehicle No */}
            <div className="kiosk-form-group">
              <label>Vehicle No (Optional)</label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Car size={18} /></div>
                <input 
                  type="text"
                  name="vehicle"
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>

            {/* Expected Date & Time */}
            <div className="kiosk-form-group">
              <label>Expected Date & Time <span>*</span></label>
              <div className="kiosk-date-time-row">
                <div className="kiosk-input-wrapper">
                  <div className="kiosk-input-icon"><Calendar size={18} /></div>
                  <input type="text" value={time.toLocaleDateString('en-GB')} readOnly />
                </div>
                <div className="kiosk-input-wrapper">
                  <input type="text" value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} readOnly />
                  <div className="kiosk-input-icon" style={{ borderRight: 'none', borderLeft: '1px solid #E5E7EB' }}><Clock size={18} /></div>
                </div>
              </div>
            </div>

            {/* Expected Duration */}
            <div className="kiosk-form-group">
              <label>Expected Duration <span>*</span></label>
              <div className="kiosk-input-wrapper">
                <div className="kiosk-input-icon"><Watch size={18} /></div>
                <div className="kiosk-select-wrapper">
                  <select name="duration" required>
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">Half Day</option>
                    <option value="8">Full Day</option>
                  </select>
                  <ChevronDown size={16} className="kiosk-select-icon" />
                </div>
              </div>
            </div>
            
          </div>

          <div className="portal-kiosk-bottom">
            <div className="kiosk-action-bar">
              <button type="button" className="kiosk-btn kiosk-btn-outline" onClick={handleClear}>
                <RefreshCw size={18} /> Clear
              </button>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" className="kiosk-btn kiosk-btn-outline" onClick={() => navigate(-1)}>
                  <X size={18} /> Cancel
                </button>
                <button type="submit" className="kiosk-btn kiosk-btn-primary">
                  <UserPlus size={18} /> Register Visitor
                </button>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};
