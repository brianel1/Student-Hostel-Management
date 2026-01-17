import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI } from '../../services/api';
import { EyeIcon, CloseIcon, SendIcon, SearchIcon, FilterIcon, TrashIcon } from '../../components/Icons';
import { toGMT8LocaleString, toGMT8LocaleDateString } from '../../utils/dateUtils';

const AdminComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [statusChange, setStatusChange] = useState(null);
  const [resolutionImage, setResolutionImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    setStatusChange(null);
    setResolutionImage(null);
    fetchComments(complaint.id);
  };

  const handleStatusChange = async () => {
    if (!statusChange) return;
    
    // If changing to resolved, require resolution image
    if (statusChange === 'resolved' && !selectedComplaint.resolution_images?.length && !resolutionImage) {
      alert('Please upload a resolution image before marking as resolved');
      return;
    }
    
    try {
      // Upload resolution image if provided
      if (resolutionImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', resolutionImage);
        formData.append('complaint_id', selectedComplaint.id);
        formData.append('uploaded_by', 'warden');
        
        await complaintsAPI.uploadImage(formData);
        setResolutionImage(null);
        setUploadingImage(false);
      }
      
      await complaintsAPI.update({ 
        id: selectedComplaint.id, 
        status: statusChange,
        resolved_by: user.id 
      });
      
      fetchComplaints();
      setSelectedComplaint({ ...selectedComplaint, status: statusChange });
      setStatusChange(null);
    } catch (error) { 
      console.error('Error:', error);
      setUploadingImage(false);
    }
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

  const handleResolutionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.type)) {
        alert('Only JPEG, PNG, and GIF images are allowed');
        return;
      }
      setResolutionImage(file);
    }
  };

  const handleUploadResolutionImage = async () => {
    if (!resolutionImage) return;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', resolutionImage);
      formData.append('complaint_id', selectedComplaint.id);
      formData.append('uploaded_by', 'warden');
      
      await complaintsAPI.uploadImage(formData);
      setResolutionImage(null);
      
      // Refresh complaint data
      const response = await complaintsAPI.getAll();
      if (response.data.success) {
        const updatedComplaint = response.data.data.find(c => c.id === selectedComplaint.id);
        if (updatedComplaint) {
          setSelectedComplaint(updatedComplaint);
        }
        setComplaints(response.data.data);
      }
      
      setUploadingImage(false);
      alert('Resolution image uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      setUploadingImage(false);
      alert('Failed to upload image');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterPriority('');
    setFilterStatus('');
  };

  const handleDeleteComplaint = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await complaintsAPI.delete(deleteConfirm.id);
      if (response.data.success) {
        setComplaints(complaints.filter(c => c.id !== deleteConfirm.id));
        setDeleteConfirm(null);
        alert('Complaint deleted successfully');
      } else {
        alert(response.data.message || 'Failed to delete complaint');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete complaint');
    }
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
                  <td style={{ fontSize: '0.85rem' }}>{toGMT8LocaleDateString(complaint.created_at)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-primary" onClick={() => handleViewDetails(complaint)}>
                        <EyeIcon /> View
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => setDeleteConfirm(complaint)}
                        title="Delete complaint"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
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
                <p><strong>Date:</strong> {toGMT8LocaleString(selectedComplaint.created_at)}</p>
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
                    ✓ Resolved on {toGMT8LocaleString(selectedComplaint.resolved_at)}
                    {selectedComplaint.resolved_by_name && ` by ${selectedComplaint.resolved_by_name}`}
                  </p>
                </div>
              )}
              
              <div className="description-box">
                <p className="label">Description:</p>
                <p className="text">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.images?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: 500, marginBottom: '8px' }}>Student Images:</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedComplaint.images.map((img, idx) => (
                      <a key={idx} href={`http://localhost:8000/${img}`} target="_blank" rel="noopener noreferrer">
                        <img src={`http://localhost:8000/${img}`} alt="Complaint" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid var(--gray-200)' }} />
                      </a>
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

              {/* Resolution Image Upload Section */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--gray-50)', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid var(--gray-200)'
              }}>
                <p style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1rem', color: 'var(--gray-700)' }}>Resolution Images (Warden)</p>
                
                {selectedComplaint.resolution_images?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {selectedComplaint.resolution_images.map((img, idx) => (
                        <a key={idx} href={`http://localhost:8000/${img}`} target="_blank" rel="noopener noreferrer">
                          <img src={`http://localhost:8000/${img}`} alt="Resolution" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', border: '3px solid var(--success)', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  border: '2px dashed var(--primary)', 
                  borderRadius: '12px', 
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'white',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--success)';
                  e.currentTarget.style.backgroundColor = 'var(--success-light)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'white';
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleResolutionImageChange({ target: { files: [file] } });
                  }
                }}
                onClick={() => document.getElementById('resolution-file-input').click()}
                >
                  <input 
                    id="resolution-file-input"
                    type="file" 
                    accept="image/*" 
                    onChange={handleResolutionImageChange}
                    style={{ display: 'none' }}
                  />
                  
                  {resolutionImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '10px', 
                        overflow: 'hidden',
                        border: '2px solid var(--success)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <img 
                          src={URL.createObjectURL(resolutionImage)} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: 500, marginBottom: '4px' }}>
                          {resolutionImage.name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          {(resolutionImage.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadResolutionImage();
                        }}
                        disabled={uploadingImage}
                        style={{ 
                          marginTop: '8px',
                          padding: '10px 32px',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}
                      >
                        {uploadingImage ? (
                          <span>
                            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                            Uploading...
                          </span>
                        ) : (
                          <span>
                            <span style={{ marginRight: '8px' }}>📤</span>
                            Upload Image
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📁</div>
                      <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--gray-700)', marginBottom: '8px' }}>
                        Drop your image here or click to browse
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                        Upload proof that the issue has been resolved (max 5MB)
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '8px' }}>
                        Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="comments-section">
                <h4 className="comments-title">Comments ({comments.length})</h4>
                {comments.length > 0 ? comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.name} ({comment.role})</span>
                      <span className="comment-date">{toGMT8LocaleString(comment.created_at)}</span>
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

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteComplaint}
        title="Delete Complaint"
        message={`Are you sure you want to delete this complaint from ${deleteConfirm?.student_name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default AdminComplaints;
