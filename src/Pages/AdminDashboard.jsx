import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, CheckCircle, Database, RefreshCw, ShieldAlert, Trash2, Users, XCircle } from 'lucide-react';
import '../Dashboard.css';
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/admin`;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('users');
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [systemData, setSystemData] = useState(null);
  const [pendingPoliticians, setPendingPoliticians] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const getAuthHeader = useCallback(() => ({
    Authorization: `Bearer ${user?.token || localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  }), [user?.token]);

  const getErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    return data.message || data.error || fallback;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load users.'));
      const data = await res.json();
      setUsers(data);
      setSelectedUser(data[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const fetchSystemData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system-data`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load system data.'));
      const data = await res.json();
      setSystemData(data);
      setSelectedIssue(data.recentIssues?.[0] || null);
    } catch (err) {
      console.warn('System summary endpoint unavailable, using live dashboard data.', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/issues?size=100`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load issues.'));
      const data = await res.json();
      setIssues(data.content || []);
      setSelectedIssue((current) => current || data.content?.[0] || null);
    } catch (err) {
      console.warn('Unable to load issue list for system data.', err);
    }
  }, [getAuthHeader]);

  const fetchPendingPoliticians = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/pending-politicians`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load pending politicians.'));
      const data = await res.json();
      setPendingPoliticians(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const refreshCurrentView = useCallback(() => {
    if (activeView === 'users') return fetchUsers();
    if (activeView === 'system') {
      fetchSystemData();
      return fetchIssues();
    }
    return fetchPendingPoliticians();
  }, [activeView, fetchIssues, fetchPendingPoliticians, fetchSystemData, fetchUsers]);

  useEffect(() => {
    fetchUsers();
    fetchSystemData();
    fetchIssues();
    fetchPendingPoliticians();
  }, [fetchIssues, fetchPendingPoliticians, fetchSystemData, fetchUsers]);

  const openView = (view) => {
    setActiveView(view);
    setError('');
    setActionMsg('');
  };

  const deleteUser = async (targetUser) => {
    if (!window.confirm(`Remove ${targetUser.name} from the system? This also removes their issues, comments, and votes.`)) {
      return;
    }

    setProcessingId(targetUser.id);
    setError('');
    setActionMsg('');
    try {
      const res = await fetch(`${API_BASE}/delete-user/${targetUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Unable to remove user.'));
      setUsers((current) => current.filter((item) => item.id !== targetUser.id));
      setIssues((current) => current.filter((issue) => issue.userId !== targetUser.id));
      setSelectedUser((current) => current?.id === targetUser.id ? null : current);
      setActionMsg(`${targetUser.name} removed successfully.`);
      fetchSystemData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePoliticianAction = async (id, action) => {
    setProcessingId(id);
    setActionMsg('');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/${action}-politician/${id}`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, `Unable to ${action} politician.`));
      setActionMsg(`Politician ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setPendingPoliticians((current) => current.filter((item) => item.id !== id));
      fetchUsers();
      fetchSystemData();
      fetchIssues();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const countBy = (items, key) => items.reduce((totals, item) => {
    const value = String(item[key] || 'UNKNOWN');
    return { ...totals, [value]: (totals[value] || 0) + 1 };
  }, {});

  const visibleSystemData = useMemo(() => {
    const derivedRecentIssues = issues.slice(0, 10).map((issue) => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      category: issue.category,
      priority: issue.priority,
      location: issue.location,
      reportedBy: issue.userName || issue.reportedBy || 'Citizen',
      createdAt: issue.createdAt,
      feedbackRating: issue.feedbackRating,
      feedback: issue.feedback,
    }));

    return {
      totalUsers: systemData?.totalUsers || users.length,
      totalIssues: systemData?.totalIssues || issues.length,
      totalComments: systemData?.totalComments || issues.reduce((sum, issue) => sum + (issue.commentsCount || 0), 0),
      totalUpvotes: systemData?.totalUpvotes || issues.reduce((sum, issue) => sum + (issue.upvotesCount || 0), 0),
      usersByRole: systemData?.usersByRole || countBy(users, 'role'),
      usersByStatus: systemData?.usersByStatus || countBy(users, 'status'),
      issuesByStatus: systemData?.issuesByStatus || countBy(issues, 'status'),
      recentIssues: systemData?.recentIssues?.length ? systemData.recentIssues : derivedRecentIssues,
    };
  }, [issues, systemData, users]);

  return (
    <div className="dashboard">
      <section className="hero-section" style={{ marginBottom: '2rem' }}>
        <div className="hero card">
          <div className="hero-content">
            <h1>Admin Dashboard</h1>
            <p>System Administration Interface. Manage politicians, users, and platform activities.</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <button className={`stat-card admin-stat-card ${activeView === 'users' ? 'active' : ''}`} onClick={() => openView('users')}>
            <div className="stat-icon"><Users size={24} /></div>
            <div className="stat-content">
              <h3>{users.length || visibleSystemData.totalUsers || 0}</h3>
              <p>Users</p>
            </div>
          </button>
          <button className={`stat-card admin-stat-card ${activeView === 'system' ? 'active' : ''}`} onClick={() => openView('system')}>
            <div className="stat-icon"><Activity size={24} /></div>
            <div className="stat-content">
              <h3>System Data</h3>
              <p>View all platform data</p>
            </div>
          </button>
          <button className={`stat-card admin-stat-card ${activeView === 'pending' ? 'active' : ''}`} onClick={() => openView('pending')}>
            <div className="stat-icon pending"><ShieldAlert size={24} /></div>
            <div className="stat-content">
              <h3>{pendingPoliticians.length}</h3>
              <p>Pending politicians</p>
            </div>
          </button>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-card" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-section-header">
            <div>
              <h2>{activeView === 'users' ? 'User Management' : activeView === 'system' ? 'System Data' : 'Pending Politician Approvals'}</h2>
              <p>{activeView === 'users' ? 'Click a user to view details or remove an account.' : activeView === 'system' ? 'Platform totals, issue status, and recent issue data.' : 'Approve or reject politician registrations.'}</p>
            </div>
            <button className="admin-refresh-btn" onClick={refreshCurrentView} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>

          {error && <div className="dashboard-alert error">{error}</div>}
          {actionMsg && <div className="dashboard-alert success">{actionMsg}</div>}

          {activeView === 'users' && (
            <div className="admin-grid">
              <div className="admin-table-wrap">
                {loading ? <p>Loading users...</p> : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Aadhaar</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((item) => (
                        <tr key={item.id} className={selectedUser?.id === item.id ? 'selected' : ''} onClick={() => setSelectedUser(item)}>
                          <td>{item.name}</td>
                          <td><span className="admin-pill">{item.role}</span></td>
                          <td>{item.status}</td>
                          <td>****{item.aadhaarLast4}</td>
                          <td>
                            <button className="danger-btn" disabled={processingId === item.id} onClick={(event) => { event.stopPropagation(); deleteUser(item); }}>
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <DetailPanel title="User Details" item={selectedUser} />
            </div>
          )}

          {activeView === 'system' && (
            <div className="admin-grid">
              <div>
                <div className="system-metrics">
                  <Metric icon={<Users size={18} />} label="Users" value={visibleSystemData.totalUsers || 0} />
                  <Metric icon={<Database size={18} />} label="Issues" value={visibleSystemData.totalIssues || 0} />
                  <Metric icon={<Activity size={18} />} label="Comments" value={visibleSystemData.totalComments || 0} />
                  <Metric icon={<CheckCircle size={18} />} label="Upvotes" value={visibleSystemData.totalUpvotes || 0} />
                </div>
                <div className="system-breakdowns">
                  <Breakdown title="Users By Role" data={visibleSystemData.usersByRole} />
                  <Breakdown title="Users By Status" data={visibleSystemData.usersByStatus} />
                  <Breakdown title="Issues By Status" data={visibleSystemData.issuesByStatus} />
                </div>
                <h3 className="admin-subtitle">Recent Issues</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Reported By</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(visibleSystemData.recentIssues || []).map((issue) => (
                      <tr key={issue.id} className={selectedIssue?.id === issue.id ? 'selected' : ''} onClick={() => setSelectedIssue(issue)}>
                        <td>{issue.title}</td>
                        <td>{issue.status}</td>
                        <td>{issue.reportedBy}</td>
                        <td>{issue.location || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DetailPanel title="Issue Details" item={selectedIssue} />
            </div>
          )}

          {activeView === 'pending' && (
            pendingPoliticians.length === 0 ? (
              <p className="empty-state">No pending politician registrations.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Aadhaar</th>
                    <th>Party</th>
                    <th>Constituency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPoliticians.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>****{item.aadhaar?.slice(-4)}</td>
                      <td>{item.partyName || '-'}</td>
                      <td>{item.constituency || '-'}</td>
                      <td>{item.status}</td>
                      <td className="admin-actions">
                        <button className="approve-btn" disabled={processingId === item.id} onClick={() => handlePoliticianAction(item.id, 'approve')}>
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button className="danger-btn" disabled={processingId === item.id} onClick={() => handlePoliticianAction(item.id, 'reject')}>
                          <XCircle size={14} />
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </section>
    </div>
  );
};

function Metric({ icon, label, value }) {
  return (
    <div className="system-metric">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Breakdown({ title, data = {} }) {
  return (
    <div className="breakdown-card">
      <h4>{title}</h4>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="breakdown-row">
          <span>{key.replace(/_/g, ' ')}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function DetailPanel({ title, item }) {
  return (
    <aside className="admin-detail-panel">
      <h3>{title}</h3>
      {!item ? (
        <p className="empty-state">Click a row to view details.</p>
      ) : (
        Object.entries(item).map(([key, value]) => (
          <div key={key} className="detail-row">
            <span>{key.replace(/([A-Z])/g, ' $1')}</span>
            <strong>{value === null || value === undefined || value === '' ? '-' : String(value)}</strong>
          </div>
        ))
      )}
    </aside>
  );
}

export default AdminDashboard;
