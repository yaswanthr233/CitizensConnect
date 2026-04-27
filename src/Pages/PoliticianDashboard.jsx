import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Loader2, MessageSquare, Send, Star, Wrench } from 'lucide-react';
import '../Dashboard.css';
import { API_BASE_URL } from '../config/api';

const PoliticianDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [respondingIssueId, setRespondingIssueId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [commentsByIssue, setCommentsByIssue] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json'
  }), [user?.token]);

  const getErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    return data.message || data.error || fallback;
  };

  const formatStatus = (status) => String(status || '').replace(/_/g, ' ');

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Unknown date';
    return parsedDate.toLocaleDateString();
  };

  const fetchIssues = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/issues?size=50`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load issues.'));
      }

      const data = await response.json();
      setIssues(data.content || []);
    } catch (e) {
      console.error("Failed to load issues", e);
      setError(e.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (user?.token) {
      fetchIssues();
    }
  }, [fetchIssues, user?.token]);

  const setStatus = async (id, status) => {
    setError('');
    setFeedback('');
    setUpdatingStatus((current) => ({ ...current, [id]: status }));

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${id}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to update issue status.'));
      }

      const updatedIssue = await response.json();
      setIssues((currentIssues) =>
        currentIssues.map((issue) => issue.id === id ? { ...issue, ...updatedIssue } : issue)
      );
      setFeedback(`Issue marked ${formatStatus(status).toLowerCase()}.`);
    } catch (e) {
      console.error('Failed to update status', e);
      setError(e.message || 'Unable to update issue status.');
    } finally {
      setUpdatingStatus((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const loadComments = async (issueId) => {
    if (commentsByIssue[issueId]) return;

    setCommentsLoading((current) => ({ ...current, [issueId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/comments`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to load responses.'));
      }

      const comments = await response.json();
      setCommentsByIssue((current) => ({ ...current, [issueId]: comments }));
    } catch (e) {
      console.error('Failed to load comments', e);
      setError(e.message || 'Unable to load responses.');
    } finally {
      setCommentsLoading((current) => ({ ...current, [issueId]: false }));
    }
  };

  const openResponsePanel = async (issueId) => {
    setError('');
    setFeedback('');
    setResponseText('');

    if (respondingIssueId === issueId) {
      setRespondingIssueId(null);
      return;
    }

    setRespondingIssueId(issueId);
    await loadComments(issueId);
  };

  const submitResponse = async (issueId) => {
    const content = responseText.trim();
    if (!content) {
      setError('Write a response before submitting.');
      return;
    }

    setError('');
    setFeedback('');
    setSubmittingResponse(true);

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/comments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to post response.'));
      }

      const savedComment = await response.json();
      setCommentsByIssue((current) => ({
        ...current,
        [issueId]: [...(current[issueId] || []), savedComment]
      }));
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === issueId
            ? { ...issue, commentsCount: (issue.commentsCount || 0) + 1 }
            : issue
        )
      );
      setResponseText('');
      setFeedback('Response posted successfully.');
    } catch (e) {
      console.error('Failed to post response', e);
      setError(e.message || 'Unable to post response.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  return (
    <div className="dashboard">
      <section className="hero-section" style={{marginBottom: '2rem'}}>
        <div className="hero card">
          <div className="hero-content">
            <h1>Politician Dashboard</h1>
            <p>Welcome, Representative {user?.name}. Monitor public issues and provide updates.</p>
          </div>
        </div>
      </section>

      <section className="quick-actions" style={{marginBottom: '2rem'}}>
        <div className="actions-card">
           <a href="/updates" className="action-btn primary" style={{display: 'inline-flex'}}>
              Post Public Update
           </a>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-card" style={{gridColumn: '1 / -1'}}>
          <div className="activity-header">
            <h2>All Constituent Issues</h2>
            <span className="activity-count">{issues.length}</span>
          </div>

          {error && <div className="dashboard-alert error">{error}</div>}
          {feedback && <div className="dashboard-alert success">{feedback}</div>}

          <div className="activity-list">
            {loading ? <p>Loading issues...</p> : issues.length === 0 ? (
              <div className="empty-state">
                <p>No issues reported.</p>
              </div>
            ) : (
              issues.map(issue => (
                <div key={issue.id} className="politician-issue">
                  <div className="activity-item">
                    <div className="activity-content">
                      <h4>{issue.title}</h4>
                      <p style={{fontSize: '12px', color: '#666'}}>By {issue.userName || 'Citizen'} on {formatDate(issue.createdAt)}</p>
                      <p>{issue.description}</p>
                      <div className="activity-meta" style={{marginTop: '10px'}}>
                        <span className={`status-badge ${String(issue.status).toLowerCase()}`}>{formatStatus(issue.status)}</span>
                        <span className="comment-count">
                          <MessageSquare size={14} />
                          {issue.commentsCount || 0} responses
                        </span>
                        {issue.feedback && (
                          <span className="feedback-chip">
                            <Star size={14} />
                            Citizen feedback
                          </span>
                        )}
                      </div>
                      {issue.feedback && (
                        <div className="issue-feedback">
                          <div className="issue-feedback-rating">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Star key={rating} size={15} className={issue.feedbackRating >= rating ? 'active' : ''} />
                            ))}
                          </div>
                          <p>{issue.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="politician-actions">
                      <button
                        className="action-btn secondary"
                        disabled={issue.status === 'IN_PROGRESS' || issue.status === 'RESOLVED' || Boolean(updatingStatus[issue.id])}
                        onClick={() => setStatus(issue.id, 'IN_PROGRESS')}
                      >
                        {updatingStatus[issue.id] === 'IN_PROGRESS' ? <Loader2 className="spin" size={18} /> : <Wrench size={18} />}
                        Mark In Progress
                      </button>
                      <button
                        className="action-btn secondary"
                        disabled={issue.status === 'RESOLVED' || Boolean(updatingStatus[issue.id])}
                        onClick={() => setStatus(issue.id, 'RESOLVED')}
                      >
                        {updatingStatus[issue.id] === 'RESOLVED' ? <Loader2 className="spin" size={18} /> : <CheckCircle size={18} />}
                        Mark Resolved
                      </button>
                      <button className="action-btn primary" onClick={() => openResponsePanel(issue.id)}>
                        <MessageSquare size={18} />
                        Respond
                      </button>
                    </div>
                  </div>

                  {respondingIssueId === issue.id && (
                    <div className="response-panel">
                      <div className="response-thread">
                        {commentsLoading[issue.id] ? (
                          <p>Loading responses...</p>
                        ) : (commentsByIssue[issue.id] || []).length === 0 ? (
                          <p>No responses yet.</p>
                        ) : (
                          commentsByIssue[issue.id].map((comment) => (
                            <div key={comment.id} className="response-message">
                              <strong>{comment.userName || 'User'}</strong>
                              <span>{formatDate(comment.createdAt)}</span>
                              <p>{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <textarea
                        value={responseText}
                        onChange={(event) => setResponseText(event.target.value)}
                        placeholder="Write an official response for this issue..."
                        rows={4}
                      />
                      <div className="response-actions">
                        <button className="action-btn secondary" onClick={() => setRespondingIssueId(null)}>
                          Cancel
                        </button>
                        <button className="action-btn primary" disabled={submittingResponse} onClick={() => submitResponse(issue.id)}>
                          {submittingResponse ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                          Post Response
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

export default PoliticianDashboard;
