import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppUsers } from '../../context/UserContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { getUserByUsername } = useAppUsers();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = getUserByUsername(username);

      if (!user) {
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      if (user.isLocked) {
        setError('Your account is locked. Please contact the administrator.');
        setIsLoading(false);
        return;
      }

      if (!user.isActive) {
        setError('Your account is disabled.');
        setIsLoading(false);
        return;
      }

      // Check password hash (supports base64 and plain matching)
      const cleanInputPw = password.trim();
      const encodedInputPw = btoa(cleanInputPw);
      if (user.passwordHash !== encodedInputPw && user.passwordHash !== cleanInputPw) {
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      // Successful Login
      login(user, rememberMe);
      
      // Route based on role
      switch (user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'EMPLOYEE': navigate('/employee'); break;
        case 'HR': navigate('/employee'); break;
        case 'SECURITY': navigate('/security'); break;
        case 'RECEPTION': navigate('/reception'); break;
        case 'FLEET_MANAGER': navigate('/fleet'); break;
        default: navigate('/'); break;
      }
    }, 800); // Simulate network request delay
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <ShieldCheck size={48} className="login-logo" />
          <h1>Enterprise VMS</h1>
          <p>Secure Employee & Admin Portal</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-form-group">
            <label>Username</label>
            <div className="login-input-wrapper">
              <User size={18} className="login-input-icon" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="login-remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Keep me signed in</span>
          </label>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? <div className="spinner-border"></div> : 'Secure Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Protected by Enterprise RBAC Auth</p>
        </div>
      </div>
    </div>
  );
};
