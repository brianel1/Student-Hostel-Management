import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { wardensAPI } from '../../services/api';
import { CheckIcon, CloseIcon, SearchIcon, FilterIcon } from '../../components/Icons';

const AdminWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => { fetchWardens(); }, []);

  const fetchWardens = async () => {
    try {
      const response = await wardensAPI.getAll();
      if (response.data.success) setWardens(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search wardens
  const filteredWardens = useMemo(() => {
    return wardens.filter(warden => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        warden.name?.toLowerCase().includes(searchLower) ||
        warden.staff_id?.toLowerCase().includes(searchLower) ||
        warden.phone?.includes(searchTerm);

      const matchesStatus = !filterStatus || warden.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [wardens, searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredWardens.length / itemsPerPage);
  const paginatedWardens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWardens.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWardens, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, itemsPerPage]);

  const handleStatusUpdate = async () => {
    if (!confirmAction) return;
    try {
      await wardensAPI.updateStatus({ user_id: confirmAction.userId, status: confirmAction.status });
      fetchWardens();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    const action = confirmAction.status === 'active' ? 'approve' : confirmAction.status === 'rejected' ? 'reject' : 'update';
    return `Are you sure you want to ${action} this warden?`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
  };

  const activeFiltersCount = filterStatus ? 1 : 0;

  // Stats
  const activeCount = wardens.filter(w => w.status === 'active').length;
  const pendingCount = wardens.filter(w => w.status === 'pending').length;
  const rejectedCount = wardens.filter(w => w.status === 'rejected').length;

  if (loading) return <Layout title="Wardens"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Wardens Management">
      <div className="card">
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>All Wardens</h3>
              <div className="inline-stats">
                <span className="inline-stat">
                  <span className="inline-stat-value">{wardens.length}</span>
                  <span className="inline-stat-label">Total</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--success)' }}>{activeCount}</span>
                  <span className="inline-stat-label">Active</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : 'var(--gray-400)' }}>{pendingCount}</span>
                  <span className="inline-stat-label">Pending</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--gray-400)' }}>{rejectedCount}</span>
                  <span className="inline-stat-label">Rejected</span>
                </span>
              </div>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, staff ID, phone..."
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
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
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
              <tr><th>Name</th><th>Staff ID</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedWardens.length > 0 ? paginatedWardens.map(warden => (
                <tr key={warden.id}>
                  <td style={{ fontWeight: 500 }}>{warden.name}</td>
                  <td>{warden.staff_id}</td>
                  <td>{warden.phone || '-'}</td>
                  <td><span className={`badge badge-${warden.status}`}>{warden.status}</span></td>
                  <td>
                    <div className="actions">
                      {warden.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => setConfirmAction({ userId: warden.user_id, status: 'active' })}>
                            <CheckIcon /> Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirmAction({ userId: warden.user_id, status: 'rejected' })}>
                            <CloseIcon /> Reject
                          </button>
                        </>
                      )}
                      {warden.status === 'active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmAction({ userId: warden.user_id, status: 'rejected' })}>
                          Deactivate
                        </button>
                      )}
                      {warden.status === 'rejected' && (
                        <button className="btn btn-sm btn-success" onClick={() => setConfirmAction({ userId: warden.user_id, status: 'active' })}>
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5">
                  <div className="empty-state">
                    <p className="empty-title">{searchTerm || activeFiltersCount > 0 ? 'No wardens match your filters' : 'No wardens found'}</p>
                    {(searchTerm || activeFiltersCount > 0) && (
                      <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: '12px' }}>Clear Filters</button>
                    )}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredWardens.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredWardens.length)} of {filteredWardens.length} wardens
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

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleStatusUpdate}
        title="Confirm Action"
        message={getConfirmMessage()}
        confirmText="Confirm"
        type={confirmAction?.status === 'rejected' ? 'danger' : 'info'}
      />
    </Layout>
  );
};

export default AdminWardens;
