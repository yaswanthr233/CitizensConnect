import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, Loader2, PlusCircle, Star } from 'lucide-react';
import '../Dashboard.css';
import { API_BASE_URL } from '../config/api';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackIssueId, setFeedbackIssueId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json'
  }), [user?.token]);

  const getErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    return data.message || data.error || fallback;
  };

  const formatStatus = (status) => String(status || '').replace(/_/g, ' ');

  const fetchIssues = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/issues/my-issues?size=50`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load your issues.'));
      }

      const data = await response.json();
      setIssues(data.content || []);
    } catch (e) {
      console.error("Failed to load issues", e);
      setError(e.message || 'Failed to load your issues.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (user?.token) {
      fetchIssues();
    }
  }, [fetchIssues, user?.token]);

  const openFeedback = (issue) => {
    setError('');
    setFeedbackMessage('');
    setFeedbackIssueId((currentId) => currentId === issue.id ? null : issue.id);
    setFeedbackRating(issue.feedbackRating || 5);
    setFeedbackText(issue.feedback || '');
  };

  const submitFeedback = async (issueId) => {
    const feedback = feedbackText.trim();
    if (!feedback) {
      setError('Please write feedback before submitting.');
      return;
    }

    setError('');
    setFeedbackMessage('');
    setSubmittingFeedback(true);

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/feedback`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          rating: String(feedbackRating),
          feedback
        })
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to submit feedback.'));
      }

      const updatedIssue = await response.json();
      setIssues((currentIssues) =>
        currentIssues.map((issue) => issue.id === issueId ? { ...issue, ...updatedIssue } : issue)
      );
      setFeedbackIssueId(null);
      setFeedbackText('');
      setFeedbackRating(5);
      setFeedbackMessage('Feedback submitted successfully.');
    } catch (e) {
      console.error('Failed to submit feedback', e);
      setError(e.message || 'Unable to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="dashboard">
      <section className="hero-section" style={{marginBottom: '2rem'}}>
        <div className="hero card">
          <div className="hero-content">
            <h1>Citizen Dashboard</h1>
            <p>Welcome back, {user?.name}. Here you can report new issues and track their progress.</p>
          </div>
        </div>
      </section>

      <section className="quick-actions" style={{marginBottom: '2rem'}}>
        <div className="actions-card">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <a href="/issues" className="action-btn primary">
              <PlusCircle size={20} />
              <span>Report New Issue</span>
            </a>
          </div>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-card">
          <div className="activity-header">
            <h2>My Reported Issues & Status Tracking</h2>
            <span className="activity-count">{issues.length}</span>
          </div>

          {error && <div className="dashboard-alert error">{error}</div>}
          {feedbackMessage && <div className="dashboard-alert success">{feedbackMessage}</div>}

          <div className="activity-list">
            {loading ? <p>Loading issues...</p> : issues.length === 0 ? (
              <div className="empty-state">
                <p>You haven't reported any issues yet.</p>
              </div>
            ) : (
              issues.map(issue => (
                <div key={issue.id} className="citizen-issue">
                  <div className={`activity-item ${issue.status === 'RESOLVED' ? 'solved' : ''}`}>
                    <div className="activity-content">
                      <h4>{issue.title}</h4>
                      <p>{issue.description.substring(0, 100)}...</p>
                      <div className="activity-meta" style={{marginTop: '10px'}}>
                        <span className={`status-badge ${issue.status.toLowerCase()}`}>
                          {issue.status === 'PENDING' ? <Clock size={14} style={{marginRight: '4px'}}/> : null}
                          {issue.status === 'RESOLVED' ? <CheckCircle size={14} style={{marginRight: '4px'}}/> : null}
                          {formatStatus(issue.status)}
                        </span>
                        {issue.feedback && (
                          <span className="feedback-chip">
                            <Star size={14} />
                            Feedback sent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="activity-actions">
                      {issue.status === 'RESOLVED' ? (
                        issue.feedback ? (
                          <button className="btn-secondary" onClick={() => openFeedback(issue)}>View Feedback</button>
                        ) : (
                          <button className="btn-secondary" onClick={() => openFeedback(issue)}>Give Feedback</button>
                        )
                      ) : (
                        <span className="feedback-waiting">Feedback opens after resolution</span>
                      )}
                    </div>
                  </div>

                  {feedbackIssueId === issue.id && (
                    <div className="feedback-panel">
                      <div className="rating-row" aria-label="Feedback rating">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            className={`rating-btn ${feedbackRating >= rating ? 'active' : ''}`}
                            onClick={() => setFeedbackRating(rating)}
                            aria-label={`${rating} star rating`}
                          >
                            <span className="rating-star">{'\u2605'}</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackText}
                        onChange={(event) => setFeedbackText(event.target.value)}
                        placeholder="Share whether the issue was resolved properly..."
                        rows={4}
                      />
                      <div className="response-actions">
                        <button className="action-btn secondary" onClick={() => setFeedbackIssueId(null)}>
                          Cancel
                        </button>
                        <button className="action-btn primary" disabled={submittingFeedback} onClick={() => submitFeedback(issue.id)}>
                          {submittingFeedback ? <Loader2 className="spin" size={18} /> : <Star size={18} />}
                          Submit Feedback
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CitizenDashboard;
