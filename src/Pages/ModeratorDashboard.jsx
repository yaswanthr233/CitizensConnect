import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import '../Dashboard.css';

const ModeratorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <section className="hero-section" style={{marginBottom: '2rem'}}>
        <div className="hero card">
          <div className="hero-content">
            <h1>Moderator Dashboard</h1>
            <p>Content Moderation Interface. Monitor comments, resolve conflicts, and maintain community standards.</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
           <div className="stat-card">
              <div className="stat-icon solved"><MessageSquare size={24} /></div>
              <div className="stat-content">
                 <h3>Comments</h3>
                 <p>Monitor Activity</p>
              </div>
           </div>
           <div className="stat-card">
              <div className="stat-icon pending"><AlertTriangle size={24} /></div>
              <div className="stat-content">
                 <h3>Flags</h3>
                 <p>Resolve Content</p>
              </div>
           </div>
           <div className="stat-card">
              <div className="stat-icon politician"><Shield size={24} /></div>
              <div className="stat-content">
                 <h3>Guidelines</h3>
                 <p>Enforce Rules</p>
              </div>
           </div>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-card" style={{gridColumn: '1 / -1'}}>
          <h2>Reported Content Queue</h2>
          <p>Review and remove inappropriate content or ban toxic interactions to resolve conflicts.</p>
          <div style={{marginTop: '20px', padding: '20px', border: '1px dashed #ccc'}}>
             <p className="empty-state">Moderation Queue is empty</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModeratorDashboard;
