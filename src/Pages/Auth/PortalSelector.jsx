import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldAlert, BadgeCheck } from 'lucide-react';
import '../../Dashboard.css';

const PortalSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <section className="hero-section" style={{marginBottom: '3rem'}}>
        <div className="hero card" style={{textAlign: 'center', padding: '4rem 2rem'}}>
          <div className="hero-content" style={{maxWidth: '800px', margin: '0 auto'}}>
            <h1 style={{fontSize: '3rem', marginBottom: '1rem'}}>CitizensConnect Authentication Portal</h1>
            <p style={{fontSize: '1.2rem', color: '#CBD5E1'}}>Select your designated portal to securely access the platform.</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem'}}>
           
           <div className="stat-card" onClick={() => navigate('/citizen-login')} style={{cursor:'pointer', padding: '2rem', textAlign: 'center'}}>
              <div className="stat-icon" style={{margin: '0 auto 1rem auto', width: '60px', height: '60px'}}><Users size={32} /></div>
              <div className="stat-content">
                 <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>Citizen Portal</h3>
                 <p>Report issues and engage</p>
              </div>
           </div>

           <div className="stat-card" onClick={() => navigate('/politician-login')} style={{cursor:'pointer', padding: '2rem', textAlign: 'center'}}>
              <div className="stat-icon politician" style={{margin: '0 auto 1rem auto', width: '60px', height: '60px'}}><BadgeCheck size={32} /></div>
              <div className="stat-content">
                 <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>Politician Portal</h3>
                 <p>Respond to constituents</p>
              </div>
           </div>

           <div className="stat-card" onClick={() => navigate('/admin-login')} style={{cursor:'pointer', padding: '2rem', textAlign: 'center'}}>
              <div className="stat-icon pending" style={{margin: '0 auto 1rem auto', width: '60px', height: '60px'}}><ShieldAlert size={32} /></div>
              <div className="stat-content">
                 <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>Admin Portal</h3>
                 <p>System administration</p>
              </div>
           </div>

        </div>
      </section>
    </div>
  );
};

export default PortalSelector;
