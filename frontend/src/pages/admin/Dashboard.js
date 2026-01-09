import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { UsersIcon, RoomIcon, ComplaintIcon, WardenIcon, CheckIcon } from '../../components/Icons';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats(user.role);
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout title="Dashboard"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><UsersIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Total Students</p>
            <p className="stat-value">{stats?.total_students || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><RoomIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Total Rooms</p>
            <p className="stat-value">{stats?.total_rooms || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><RoomIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Available Rooms</p>
            <p className="stat-value">{stats?.available_rooms || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><ComplaintIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Pending Complaints</p>
            <p className="stat-value">{stats?.pending_complaints || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckIcon /></div>
          <div className="stat-content">
            <p className="stat-label">Resolved</p>
            <p className="stat-value">{stats?.resolved_complaints || 0}</p>
          </div>
        </div>
        {user.role === 'superadmin' && (
          <div className="stat-card">
            <div className="stat-icon red"><WardenIcon /></div>
            <div className="stat-content">
              <p className="stat-label">Pending Wardens</p>
              <p className="stat-value">{stats?.pending_wardens || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Complaints</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats?.recent_complaints?.length > 0 ? stats.recent_complaints.map(complaint => (
                <tr key={complaint.id}>
                  <td>{complaint.student_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{complaint.category}</td>
                  <td><span className={`priority-${complaint.priority}`} style={{ textTransform: 'capitalize' }}>{complaint.priority}</span></td>
                  <td><span className={`badge badge-${complaint.status}`}>{complaint.status.replace('_', ' ')}</span></td>
                  <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="empty-state"><p className="empty-title">No complaints yet</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
