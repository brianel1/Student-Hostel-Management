import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { roomsAPI } from '../../services/api';
import { EditIcon, TrashIcon, CloseIcon, SearchIcon, FilterIcon } from '../../components/Icons';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ block: '', room_no: '', capacity: 4, status: 'available' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      if (response.data.success) setRooms(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique blocks for filter
  const uniqueBlocks = useMemo(() => {
    const blocks = [...new Set(rooms.map(r => r.block))];
    return blocks.sort();
  }, [rooms]);

  // Filter and search rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        room.block?.toLowerCase().includes(searchLower) ||
        room.room_no?.toLowerCase().includes(searchLower) ||
        `${room.block}-${room.room_no}`.toLowerCase().includes(searchLower);

      const matchesBlock = !filterBlock || room.block === filterBlock;
      const matchesStatus = !filterStatus || room.status === filterStatus;

      return matchesSearch && matchesBlock && matchesStatus;
    });
  }, [rooms, searchTerm, filterBlock, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRooms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRooms, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterBlock, filterStatus, itemsPerPage]);

  const validateForm = () => {
    if (!formData.block.trim()) { setError('Block is required'); return false; }
    if (!formData.room_no.trim()) { setError('Room number is required'); return false; }
    if (formData.capacity < 1) { setError('Capacity must be at least 1'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    try {
      if (editingId) {
        await roomsAPI.update({ ...formData, id: editingId });
      } else {
        await roomsAPI.create(formData);
      }
      fetchRooms();
      closeModal();
    } catch (error) {
      setError('Failed to save room');
    }
  };

  const handleEdit = (room) => {
    setFormData({ block: room.block, room_no: room.room_no, capacity: room.capacity, status: room.status });
    setEditingId(room.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await roomsAPI.delete(deleteId);
      fetchRooms();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ block: '', room_no: '', capacity: 4, status: 'available' });
    setEditingId(null);
    setError('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBlock('');
    setFilterStatus('');
  };

  const activeFiltersCount = [filterBlock, filterStatus].filter(Boolean).length;

  // Stats
  const availableCount = rooms.filter(r => r.status === 'available').length;
  const fullCount = rooms.filter(r => r.status === 'full').length;
  const maintenanceCount = rooms.filter(r => r.status === 'maintenance').length;
  const totalCapacity = rooms.reduce((sum, r) => sum + parseInt(r.capacity), 0);
  const totalOccupants = rooms.reduce((sum, r) => sum + parseInt(r.occupants || 0), 0);

  if (loading) return <Layout title="Rooms"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="Rooms Management">
      <div className="card">
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>All Rooms</h3>
              <div className="inline-stats">
                <span className="inline-stat">
                  <span className="inline-stat-value">{rooms.length}</span>
                  <span className="inline-stat-label">Total</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--success)' }}>{availableCount}</span>
                  <span className="inline-stat-label">Available</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--danger)' }}>{fullCount}</span>
                  <span className="inline-stat-label">Full</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--warning)' }}>{maintenanceCount}</span>
                  <span className="inline-stat-label">Maintenance</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value">{totalOccupants}/{totalCapacity}</span>
                  <span className="inline-stat-label">Occupancy</span>
                </span>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add Room</button>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by block or room number..."
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
                <label>Block</label>
                <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
                  <option value="">All Blocks</option>
                  {uniqueBlocks.map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear All</button>
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Room</th><th>Block</th><th>Room No</th><th>Capacity</th><th>Occupants</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedRooms.length > 0 ? paginatedRooms.map(room => (
                <tr key={room.id}>
                  <td style={{ fontWeight: 600 }}>{room.block}-{room.room_no}</td>
                  <td>{room.block}</td>
                  <td>{room.room_no}</td>
                  <td>{room.capacity}</td>
                  <td>
                    <span style={{ 
                      color: parseInt(room.occupants) >= parseInt(room.capacity) ? 'var(--danger)' : 
                             parseInt(room.occupants) > 0 ? 'var(--success)' : 'var(--gray-500)'
                    }}>
                      {room.occupants}/{room.capacity}
                    </span>
                  </td>
                  <td><span className={`badge badge-${room.status}`}>{room.status}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(room)} title="Edit"><EditIcon /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(room.id)} title="Delete"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7">
                  <div className="empty-state">
                    <p className="empty-title">{searchTerm || activeFiltersCount > 0 ? 'No rooms match your filters' : 'No rooms added'}</p>
                    {(searchTerm || activeFiltersCount > 0) && (
                      <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: '12px' }}>Clear Filters</button>
                    )}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRooms.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRooms.length)} of {filteredRooms.length} rooms
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Room' : 'Add Room'}</h3>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Block *</label>
                    <input type="text" value={formData.block} onChange={(e) => setFormData({...formData, block: e.target.value})} placeholder="e.g., B3" />
                  </div>
                  <div className="form-group">
                    <label>Room Number *</label>
                    <input type="text" value={formData.room_no} onChange={(e) => setFormData({...formData, room_no: e.target.value})} placeholder="e.g., 13" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input 
                      type="text" 
                      value={formData.capacity} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({...formData, capacity: value ? parseInt(value) : ''});
                      }} 
                      placeholder="Enter capacity"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default AdminRooms;
