import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI } from '../../services/api';
import { EyeIcon, SendIcon, CloseIcon } from '../../components/Icons';
import { toGMT8LocaleString, toGMT8LocaleDateString } from '../../utils/dateUtils';

const StudentComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await complaintsAPI.getAll({ student_id: user.student_id });
      if (response.data.success) setComplaints(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (complaintId) => {
    try {
      const response = await complaintsAPI.getComments(complaintId);
      if (response.data.success) setComments(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    fetchComments(complaint.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await complaintsAPI.addComment({
        complaint_id: selectedComplaint.id,
        user_id: user.id,
        comment: newComment
      });
      setNewComment('');
      fetchComments(selectedComplaint.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Layout title="My Complaints"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="My Complaints">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Complaints ({complaints.length})</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Priority</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td style={{ textTransform: 'capitalize' }}>{complaint.category}</td>
                    <td>
                      <span className={`priority-${complaint.priority}`} style={{ textTransform: 'capitalize' }}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {complaint.description}
                    </td>
                    <td>
                      <span className={`badge badge-${complaint.status}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{toGMT8LocaleDateString(complaint.created_at)}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleViewDetails(complaint)}>
                        <EyeIcon /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <p className="empty-title">No complaints submitted</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Complaint Details</h3>
              <button className="modal-close" onClick={() => setSelectedComplaint(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <p><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedComplaint.category}</span></p>
                <p><strong>Priority:</strong> <span className={`priority-${selectedComplaint.priority}`} style={{ textTransform: 'capitalize' }}>{selectedComplaint.priority}</span></p>
                <p><strong>Status:</strong> <span className={`badge badge-${selectedComplaint.status}`}>{selectedComplaint.status.replace('_', ' ')}</span></p>
                <p><strong>Submitted:</strong> {toGMT8LocaleString(selectedComplaint.created_at)}</p>
              </div>
              
              {selectedComplaint.status === 'resolved' && selectedComplaint.resolved_at && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--success-light)', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  border: '1px solid var(--success)'
                }}>
                  <p style={{ margin: 0, color: 'var(--success)', fontWeight: 500 }}>
                    ✓ Issue Resolved on {toGMT8LocaleString(selectedComplaint.resolved_at)}
                    {selectedComplaint.resolved_by_name && ` by ${selectedComplaint.resolved_by_name}`}
                  </p>
                </div>
              )}
              
              <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontWeight: 500, marginBottom: '8px' }}>Description:</p>
                <p style={{ color: 'var(--gray-700)' }}>{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.images?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: 500, marginBottom: '8px' }}>Your Images:</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedComplaint.images.map((img, idx) => (
                      <a key={idx} href={`http://localhost:8000/${img}`} target="_blank" rel="noopener noreferrer">
                        <img src={`http://localhost:8000/${img}`} alt="Complaint" 
                             style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid var(--gray-200)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedComplaint.resolution_images?.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--success-light)', borderRadius: '8px', border: '1px solid var(--success)' }}>
                  <p style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--success)' }}>Resolution Images (Warden):</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedComplaint.resolution_images.map((img, idx) => (
                      <a key={idx} href={`http://localhost:8000/${img}`} target="_blank" rel="noopener noreferrer">
                        <img src={`http://localhost:8000/${img}`} alt="Resolution" 
                             style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid var(--success)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="comments-section">
                <h4 className="comments-title">Comments ({comments.length})</h4>
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.name} ({comment.role})</span>
                        <span className="comment-date">{toGMT8LocaleString(comment.created_at)}</span>
                      </div>
                      <p className="comment-text">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No comments yet</p>
                )}
                <form className="comment-form" onSubmit={handleAddComment}>
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !newComment.trim()}>
                    <SendIcon /> {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentComplaints;
