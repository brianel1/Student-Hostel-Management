import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI } from '../../services/api';
import { EyeIcon, CloseIcon, SendIcon, SearchIcon, FilterIcon } from '../../components/Icons';

const AdminComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [statusChange, setStatusChange] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const response = await complaintsAPI.getAll();
      if (response.data.success) setComplaints(response.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const fetchComments = async (complaintId) => {
    try {
      const response = await complaintsAPI.getComments(complaintId);
      if (response.data.success) setComments(response.data.data);
    } catch (error) { console.error('Error:', error); }
  };

  // Filter and search complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        complaint.student_name?.toLowerCase().includes(searchLower) ||
        complaint.matric_no?.toLowerCase().includes(searchLower) ||
        complaint.description?.toLowerCase().includes(searchLower) ||
        `${complaint.block}-${complaint.room_no}`.toLowerCase().includes(searchLower);

      const matchesCategory = !filterCategory || complaint.category === filterCategory;
      const matchesPriority = !filterPriority || complaint.priority === filterPriority;
      const matchesStatus = !filterStatus || complaint.status === filterStatus;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [complaints, searchTerm, filterCategory, filterPriority, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory, filterPriority, filterStatus, itemsPerPage]);

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    fetchComments(complaint.id);
  };

  const handleStatusChange = async () => {
    if (!statusChange) return;
    try {
      await complaintsAPI.update({ id: selectedComplaint.id, status: statusChange });
      fetchComplaints();
      setSelectedComplaint({ ...selectedComplaint, status: statusChange });
    } catch (error) { console.error('Error:', error); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await complaintsAPI.addComment({ complaint_id: selectedComplaint.id, user_id: user.id, comment: newComment });
      setNewComment('');
      fetchComments(selectedComplaint.id);
    } catch (error) { console.error('Error:', error); }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterPriority('');
    setFilterStatus('');
  };

  const activeFiltersCount = [filterCategory, filterPriority, filterStatus].filter(Boolean).length;

  // Stats
  const submittedCount = complaints.filter(c => c.status === 'submitted').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress' || c.status === 'in_review').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const highPriorityCount = complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length;

  if (loading) return <Layout title="Complaints"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Complaints Management">
      <div className="card">
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>All Complaints</h3>
              <div className="inline-stats">
                <span className="inline-stat">
                  <span className="inline-stat-value">{complaints.length}</span>
                  <span className="inline-stat-label">Total</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--primary)' }}>{submittedCount}</span>
                  <span className="inline-stat-label">New</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--warning)' }}>{inProgressCount}</span>
                  <span className="inline-stat-label">In Progress</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--success)' }}>{resolvedCount}</span>
                  <span className="inline-stat-label">Resolved</span>
                </span>
                {highPriorityCount > 0 && (
                  <>
                    <span className="inline-stat-divider"></span>
                    <span className="inline-stat">
                      <span className="inline-stat-value" style={{ color: 'var(--danger)' }}>{highPriorityCount}</span>
                      <span className="inline-stat-label">High Priority</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by student, matric no, room, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>}
            </div>
            <button
              className={`btn btn-outline btn-sm ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="electric">Electric</option>
                  <option value="water">Water</option>
                  <option value="furniture">Furniture</option>
                  <option value="internet">Internet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Priority</label>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear All</button>
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Room</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedComplaints.length > 0 ? paginatedComplaints.map(complaint => (
                <tr key={complaint.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{complaint.student_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{complaint.matric_no}</div>
                    </div>
                  </td>
                  <td>{complaint.block ? `${complaint.block}-${complaint.room_no}` : '-'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{complaint.category}</td>
                  <td><span className={`priority-${complaint.priority}`} style={{ textTransform: 'capitalize' }}>{complaint.priority}</span></td>
                  <td><span className={`badge badge-${complaint.status}`}>{complaint.status.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(complaint.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-sm btn-primary" onClick={() => handleViewDetails(complaint)}><EyeIcon /> View</button></td>
                </tr>
              )) : (
                <tr><td colSpan="7">
                  <div className="empty-state">
                    <p className="empty-title">{searchTerm || activeFiltersCount > 0 ? 'No complaints match your filters' : 'No complaints'}</p>
                    {(searchTerm || activeFiltersCount > 0) && (
                      <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: '12px' }}>Clear Filters</button>
                    )}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredComplaints.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
            </div>
            <div className="pagination-controls">
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="pagination-select">
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <div className="pagination-buttons">
                <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>«</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                  );
                })}
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>»</button>
                <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»»</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Complaint Details</h3>
              <button className="modal-close" onClick={() => setSelectedComplaint(null)}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <p><strong>Student:</strong> {selectedComplaint.student_name}</p>
                <p><strong>Matric:</strong> {selectedComplaint.matric_no}</p>
                <p><strong>Room:</strong> {selectedComplaint.block ? `${selectedComplaint.block}-${selectedComplaint.room_no}` : 'Not assigned'}</p>
                <p><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedComplaint.category}</span></p>
                <p><strong>Priority:</strong> <span className={`priority-${selectedComplaint.priority}`} style={{ textTransform: 'capitalize' }}>{selectedComplaint.priority}</span></p>
                <p><strong>Date:</strong> {new Date(selectedComplaint.created_at).toLocaleString()}</p>
              </div>
              
              <div className="description-box">
                <p className="label">Description:</p>
                <p className="text">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.images?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: 500, marginBottom: '8px' }}>Images:</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedComplaint.images.map((img, idx) => (
                      <img key={idx} src={`http://localhost:8000/${img}`} alt="Complaint" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Update Status</label>
                <select value={selectedComplaint.status} onChange={(e) => setStatusChange(e.target.value)}>
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="comments-section">
                <h4 className="comments-title">Comments ({comments.length})</h4>
                {comments.length > 0 ? comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.name} ({comment.role})</span>
                      <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                )) : <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No comments yet</p>}
                <form className="comment-form" onSubmit={handleAddComment}>
                  <input type="text" className="comment-input" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <button type="submit" className="btn btn-primary btn-sm"><SendIcon /> Send</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!statusChange && statusChange !== selectedComplaint?.status}
        onClose={() => setStatusChange(null)}
        onConfirm={handleStatusChange}
        title="Update Status"
        message={`Are you sure you want to change the status to "${statusChange?.replace('_', ' ')}"?`}
        confirmText="Update"
        type="info"
      />
    </Layout>
  );
};

export default AdminComplaints;
