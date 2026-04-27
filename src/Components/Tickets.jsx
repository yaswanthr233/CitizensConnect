import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import {
  MessageSquare, Camera, AlertTriangle,
  CheckCircle, Clock, User, Send, X, ChevronUp, RefreshCw
} from 'lucide-react';
import './Tickets.css';
import { API_BASE_URL } from '../config/api';

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#10b981', icon: Clock },
  medium: { label: 'Medium', color: '#f59e0b', icon: AlertTriangle },
  high: { label: 'High', color: '#ef4444', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: '#dc2626', icon: AlertTriangle }
};

const TICKET_CATEGORIES = [
  'Infrastructure', 'Healthcare', 'Education', 'Environment',
  'Transportation', 'Public Safety', 'Utilities', 'Other'
];

const API_BASE = API_BASE_URL;

const Tickets = () => {
  const { user } = useAuth();
  
  const [issues, setIssues] = useState([]);
  const [allComments, setAllComments] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [filter, setFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('newest'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [messageInput, setMessageInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentPosted, setCommentPosted] = useState(false);

  // Form states
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    images: []
  });

  const messagesEndRef = useRef(null);
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchIssues = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/issues?page=0&size=50`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.content || []);
      }
    } catch (e) {
      console.error('Failed to fetch issues:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIssues();
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allComments]);

  // Image upload with dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));
      setTicketForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    },
    maxFiles: 5
  });

  const removeImage = (imageId) => {
    setTicketForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/issues`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: ticketForm.title,
          description: ticketForm.description,
          category: ticketForm.category || 'Other',
          priority: ticketForm.priority,
          location: ticketForm.location || 'Unknown'
        })
      });

      if (res.ok) {
        fetchIssues();
        setTicketForm({
          title: '', description: '', category: '',
          priority: 'medium', location: '', images: []
        });
        setShowCreateForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleVote = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/issues/${ticketId}/upvote`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkDone = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/issues/${ticketId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'SOLVED' })
      });
      if (res.ok) fetchIssues();
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/issues/${ticketId}/comments`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAllComments(prev => ({ ...prev, [ticketId]: data }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (ticketId) => {
    if (messageInput.trim()) {
      try {
        const res = await fetch(`${API_BASE}/issues/${ticketId}/comments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: messageInput })
        });
        
        if (res.ok) {
          setMessageInput('');
          setCommentPosted(true);
          setTimeout(() => setCommentPosted(false), 3000);
          loadMessages(ticketId);
          fetchIssues();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
  };

  const closeTicketDetails = () => {
    setSelectedTicket(null);
  };

  const filteredAndSortedTickets = issues
    .filter(issue => {
      if (!issue) return false;
      const tStatus = String(issue.status).toLowerCase();
      
      const matchesFilter =
        filter === 'all' ||
        (filter === 'open' && tStatus === 'open') ||
        (filter === 'solved' && tStatus === 'solved') ||
        (filter === 'my_tickets' && issue.userId === user?.id);

      const matchesSearch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        case 'votes':
          return b.upvotesCount - a.upvotesCount;
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (!user) {
    return (
      <div className="tickets-container">
        <div className="login-prompt">
          <h2>Please login to view and create issues</h2>
          <p>Once logged in, you'll be able to report civic issues and track their progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <div className="header-content">
          <h1>Citizen Issues & Concerns</h1>
          <p>Raise civic issues, track progress, and communicate directly with politicians</p>
        </div>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={fetchIssues}
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Issues'}
          </button>
          <button
            className="create-ticket-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <MessageSquare size={18} />
            Create New Issue
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="tickets-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Issues</option>
            <option value="open">Open</option>
            <option value="solved">Solved</option>
            <option value="my_tickets">My Issues</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="priority">Priority</option>
            <option value="votes">Most Voted</option>
          </select>
        </div>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content ticket-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Ticket</h2>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="ticket-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for your issue"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {TICKET_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    {Object.entries(PRIORITY_LEVELS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={ticketForm.location}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Area/Location"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label>Images (Optional)</label>
                <div className="image-upload">
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    <Camera size={24} />
                    <p>{isDragActive ? 'Drop images here' : 'Drag & drop images or click to select'}</p>
                    <span className="upload-hint">Max 5 images</span>
                  </div>
                  {ticketForm.images.length > 0 && (
                    <div className="image-previews">
                      {ticketForm.images.map((image) => (
                        <div key={image.id} className="image-preview">
                          <img src={image.preview} alt="Preview" />
                          <button type="button" className="remove-image" onClick={() => removeImage(image.id)}><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn" style={{background: '#3b82f6', color: 'white'}}>Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="tickets-list">
        {filteredAndSortedTickets.length === 0 ? (
          <div className="no-tickets">
            <MessageSquare size={48} />
            <h3>{searchTerm ? 'No issues found' : 'No issues reported yet'}</h3>
            {!searchTerm && (
              <button className="create-ticket-btn" onClick={() => setShowCreateForm(true)} style={{marginTop: '20px'}}>
                <MessageSquare size={18} /> Report Your First Issue
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedTickets.map(ticket => {
            const PriorityIcon = PRIORITY_LEVELS[ticket.priority]?.icon || Clock;
            const priorityColor = PRIORITY_LEVELS[ticket.priority]?.color || '#6b7280';
            const displayStatus = String(ticket.status).toLowerCase();

            return (
              <div key={ticket.id} className={`ticket-card ${displayStatus}`}>
                <div className="ticket-header">
                  <div className="ticket-meta">
                    <span className="priority-badge" style={{ backgroundColor: priorityColor }}>
                      <PriorityIcon size={14} /> {PRIORITY_LEVELS[ticket.priority]?.label || 'General'}
                    </span>
                    <span className="category-badge">{ticket.category || 'General'}</span>
                    <span className={`status-badge ${displayStatus}`}>
                      {displayStatus === 'solved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {ticket.status}
                    </span>
                  </div>

                  <div className="ticket-actions">
                    {user?.roles?.includes('POLITICIAN') && displayStatus === 'open' && (
                      <button className="mark-done-btn" onClick={() => handleMarkDone(ticket.id)}>
                        <CheckCircle size={16} /> Mark Done
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="ticket-title">{ticket.title}</h3>
                <p className="ticket-description">{ticket.description}</p>

                <div className="ticket-footer">
                  <div className="ticket-author">
                    <User size={16} />
                    <span>{ticket.userName}</span>
                    <span className="ticket-date">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="ticket-actions">
                    <button
                      className={`vote-btn`}
                      onClick={() => handleVote(ticket.id)}
                    >
                      <ChevronUp size={16} />
                      <span>{ticket.upvotesCount || 0}</span>
                    </button>

                    <button
                      className="comment-btn"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      <MessageSquare size={16} />
                      <span>{ticket.commentsCount || 0}</span>
                      <span className="comment-text">Comments</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={closeTicketDetails}>
          <div className="modal-content ticket-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="ticket-details-header">
                <h2>{selectedTicket.title}</h2>
                <div className="ticket-meta-badges">
                  <span className="priority-badge" style={{ backgroundColor: PRIORITY_LEVELS[selectedTicket.priority]?.color }}>
                    {PRIORITY_LEVELS[selectedTicket.priority]?.label}
                  </span>
                  <span className="category-badge">{selectedTicket.category}</span>
                </div>
              </div>
              <button className="close-btn" onClick={closeTicketDetails}><X size={20} /></button>
            </div>

            <div className="ticket-details-content">
              <div className="ticket-description-full">
                <p>{selectedTicket.description}</p>
              </div>

              {/* Messages/Comments Section */}
              <div className="messages-section">
                <h3>Discussion</h3>

                <div className="messages-list">
                  {(allComments[selectedTicket.id] || []).map((message, idx) => (
                    <div key={idx} className={`message ${message.userId === user?.id ? 'my-message' : ''}`}>
                      <div className="message-header">
                        <strong className="message-author">{message.userName}</strong>
                        <span className="message-time">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input-section">
                  <div className="message-input-header">
                    <MessageSquare size={16} /> <span>Add your comment</span>
                    {commentPosted && <span className="comment-success">✓ Comment posted!</span>}
                  </div>
                  <div className="message-input">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Share your thoughts, suggestions, or updates..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(selectedTicket.id)}
                    />
                    <button
                      onClick={() => handleSendMessage(selectedTicket.id)}
                      disabled={!messageInput.trim()}
                      className={!messageInput.trim() ? 'disabled' : ''}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
