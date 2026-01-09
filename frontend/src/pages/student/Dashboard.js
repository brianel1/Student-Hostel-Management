import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI, authAPI } from '../../services/api';
import { RoomIcon, ComplaintIcon, CheckIcon, PlusIcon } from '../../components/Icons';

const StudentDashboard = () => {
  const { user, login } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, profileRes] = await Promise.all([
        complaintsAPI.getAll({ student_id: user.student_id }),
        authAPI.getProfile(user.id)
      ]);
      
      if (complaintsRes.data.success) setComplaints(complaintsRes.data.data);
      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        // Update user context with fresh data
        login({ ...user, ...profileRes.data.data });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ['submitted', 'in_review', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length
  };

  if (loading) return <Layout title="Dashboard"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Dashboard">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gray-700)', marginBottom: '4px' }}>Welcome back, {user.name}!</h2>
        <p style={{ color: 'var(--gray-500)' }}>Here's what's happening with your complaints</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><RoomIcon /></div>
          <div className="stat-content">
            <p className="stat-label">My Room</p>
            <p className="stat-value" style={{ fontSize: '1.25rem' }}>
              {profile?.block && profile?.room_no ? `${profile.block}-${profile.room_no}` : 'Not Assigned'}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ComplaintIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Total Complaints</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><ComplaintIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <p className="stat-value">{stats.pending}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Resolved</p>
            <p className="stat-value">{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Link to="/student/complaints/new" className="btn btn-primary"><PlusIcon /> Submit New Complaint</Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Complaints</h3>
          <Link to="/student/complaints" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Category</th><th>Priority</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {complaints.slice(0, 5).length > 0 ? complaints.slice(0, 5).map(complaint => (
                <tr key={complaint.id}>
                  <td style={{ textTransform: 'capitalize' }}>{complaint.category}</td>
                  <td><span className={`priority-${complaint.priority}`} style={{ textTransform: 'capitalize' }}>{complaint.priority}</span></td>
                  <td><span className={`badge badge-${complaint.status}`}>{complaint.status.replace('_', ' ')}</span></td>
                  <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan="4"><div className="empty-state"><p className="empty-title">No complaints yet</p><p className="empty-text">Submit your first complaint to get started</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
