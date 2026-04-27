import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import '../../Dashboard.css';

const AdminLogin = () => {
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
    password: '',
    adminSecret: ''
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
        await login('admin', formData.aadhaar, formData.password);
        navigate('/admin-dashboard');
      } else {
        await register('admin', formData);
        setSuccessMsg('Admin Registration successful! You can now login.');
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
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#e53e3e' }}>
           <ShieldAlert size={48} style={{ margin: '0 auto' }}/>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Admin Portal</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          Restricted access. Secret Clearance required.
        </p>

        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
          <button 
             type="button"
             style={{ flex: 1, padding: '10px', background: isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: isLoginView ? '2px solid #e53e3e' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(true)}>
             Login
          </button>
          <button 
             type="button"
             style={{ flex: 1, padding: '10px', background: !isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: !isLoginView ? '2px solid #e53e3e' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(false)}>
             Register
          </button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}
        {successMsg && <div style={{ color: 'green', marginBottom: '1rem', padding: '10px', background: '#e6ffe6', borderRadius: '4px' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin Secret Key</label>
                <input type="password" value={formData.adminSecret} onChange={(e) => handleInputChange('adminSecret', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin ID / Aadhaar</label>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="action-btn" disabled={false}>
            {loading ? 'Authenticating...' : (isLoginView ? 'Secure Login' : 'Register Admin')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
