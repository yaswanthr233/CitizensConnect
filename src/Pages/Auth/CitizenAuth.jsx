import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import '../../Dashboard.css';

const CitizenAuth = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    aadhaar: '',
    password: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLoginView) {
        await login('citizen', formData.aadhaar, formData.password);
        navigate('/citizen-dashboard');
      } else {
        await register('citizen', formData);
        setSuccessMsg('Registration successful! Please login.');
        setIsLoginView(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Citizen Portal</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          {isLoginView ? 'Login to report and track issues.' : 'Create an account to participate in governance.'}
        </p>

        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
          <button 
             style={{ flex: 1, padding: '10px', background: isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: isLoginView ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(true)}>
             Login
          </button>
          <button 
             style={{ flex: 1, padding: '10px', background: !isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: !isLoginView ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(false)}>
             Register
          </button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}
        {successMsg && <div style={{ color: 'green', marginBottom: '1rem', padding: '10px', background: '#e6ffe6', borderRadius: '4px' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                required={!isLoginView}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Aadhaar Number</label>
            <input
              type="text"
              value={formData.aadhaar}
              onChange={(e) => handleInputChange('aadhaar', e.target.value.replace(/\D/g, '').slice(0,12))}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              minLength={12}
              maxLength={12}
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="action-btn" disabled={false}>
            {loading ? 'Processing...' : (isLoginView ? 'Login securely' : 'Register securely')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenAuth;
