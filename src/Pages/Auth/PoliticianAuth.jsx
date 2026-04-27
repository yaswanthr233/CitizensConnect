import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import '../../Dashboard.css';

const PoliticianAuth = () => {
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
    partyName: '',
    constituency: '',
    govtIdProof: ''
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
        await login('politician', formData.aadhaar, formData.password);
        navigate('/politician-dashboard');
      } else {
        await register('politician', formData);
        setSuccessMsg('Registration submitted! You are pending Admin verification.');
        setIsLoginView(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Politician Portal</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          {isLoginView ? 'Login to your representative dashboard.' : 'Register as an official representative.'}
        </p>

        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
          <button 
             style={{ flex: 1, padding: '10px', background: isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: isLoginView ? '2px solid #ed8936' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(true)}>
             Login
          </button>
          <button 
             style={{ flex: 1, padding: '10px', background: !isLoginView ? '#f0f0f0' : 'transparent', border: 'none', borderBottom: !isLoginView ? '2px solid #ed8936' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
             onClick={() => setIsLoginView(false)}>
             Register
          </button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}
        {successMsg && <div style={{ color: '#9c4221', marginBottom: '1rem', padding: '10px', background: '#feebc8', borderRadius: '4px', border: '1px solid #fbd38d' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Political Party</label>
                <input type="text" value={formData.partyName} onChange={(e) => handleInputChange('partyName', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Constituency</label>
                <input type="text" value={formData.constituency} onChange={(e) => handleInputChange('constituency', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Gov ID Proof URL/Ref</label>
                <input type="text" value={formData.govtIdProof} onChange={(e) => handleInputChange('govtIdProof', e.target.value)} placeholder="e.g. MLA-12345" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required={!isLoginView} />
              </div>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="action-btn" disabled={false}>
            {loading ? 'Processing...' : (isLoginView ? 'Login securely' : 'Submit Registration')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PoliticianAuth;
