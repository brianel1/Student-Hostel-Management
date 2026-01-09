import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { studentsAPI, roomsAPI } from '../../services/api';
import { CloseIcon, EyeIcon, RoomIcon, SearchIcon, FilterIcon, DownloadIcon, TrashIcon } from '../../components/Icons';
import ConfirmDialog from '../../components/ConfirmDialog';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, roomId: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, student: null });
  const [selectedRoom, setSelectedRoom] = useState('');
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterRoomStatus, setFilterRoomStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, roomsRes] = await Promise.all([
        studentsAPI.getAll(),
        roomsAPI.getAll()
      ]);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (roomsRes.data.success) setRooms(roomsRes.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique blocks and semesters for filters
  const uniqueBlocks = useMemo(() => {
    const blocks = [...new Set(students.filter(s => s.block).map(s => s.block))];
    return blocks.sort();
  }, [students]);

  const uniqueSemesters = useMemo(() => {
    const semesters = [...new Set(students.filter(s => s.semester).map(s => s.semester))];
    return semesters.sort((a, b) => a - b);
  }, [students]);

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        student.name?.toLowerCase().includes(searchLower) ||
        student.matric_no?.toLowerCase().includes(searchLower) ||
        student.phone?.includes(searchTerm);
      
      // Block filter
      const matchesBlock = !filterBlock || student.block === filterBlock;
      
      // Semester filter
      const matchesSemester = !filterSemester || String(student.semester) === filterSemester;
      
      // Room status filter
      const matchesRoomStatus = !filterRoomStatus || 
        (filterRoomStatus === 'assigned' && student.room_id) ||
        (filterRoomStatus === 'unassigned' && !student.room_id);
      
      return matchesSearch && matchesBlock && matchesSemester && matchesRoomStatus;
    });
  }, [students, searchTerm, filterBlock, filterSemester, filterRoomStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBlock, filterSemester, filterRoomStatus, itemsPerPage]);

  const handleAssignRoom = async (roomId) => {
    try {
      await studentsAPI.update({ id: selectedStudent.id, room_id: roomId });
      fetchData();
      setShowModal(false);
      setSelectedRoom('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const confirmAssignRoom = () => {
    if (!selectedRoom) return;
    setConfirmDialog({ isOpen: true, roomId: selectedRoom });
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleDeleteStudent = async () => {
    if (!deleteDialog.student) return;
    try {
      const response = await studentsAPI.delete(deleteDialog.student.id);
      if (response.data.success) {
        fetchData();
        setDeleteDialog({ isOpen: false, student: null });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBlock('');
    setFilterSemester('');
    setFilterRoomStatus('');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Matric No', 'Phone', 'Semester', 'Room', 'Program'];
    const csvData = filteredStudents.map(s => [
      s.name,
      s.matric_no,
      s.phone || '',
      s.semester || '',
      s.block ? `${s.block}-${s.room_no}` : 'Not assigned',
      s.program || ''
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const activeFiltersCount = [filterBlock, filterSemester, filterRoomStatus].filter(Boolean).length;

  if (loading) return <Layout title="Students"><div className="loading">Loading...</div></Layout>;

  const assignedCount = students.filter(s => s.room_id).length;
  const unassignedCount = students.filter(s => !s.room_id).length;

  return (
    <Layout title="Students Management">
      <div className="card">
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          {/* Title Row with Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>All Students</h3>
              <div className="inline-stats">
                <span className="inline-stat">
                  <span className="inline-stat-value">{students.length}</span>
                  <span className="inline-stat-label">Total</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: 'var(--success)' }}>{assignedCount}</span>
                  <span className="inline-stat-label">Assigned</span>
                </span>
                <span className="inline-stat-divider"></span>
                <span className="inline-stat">
                  <span className="inline-stat-value" style={{ color: unassignedCount > 0 ? 'var(--warning)' : 'var(--gray-400)' }}>{unassignedCount}</span>
                  <span className="inline-stat-label">Unassigned</span>
                </span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={exportToCSV}>
              <DownloadIcon /> Export
            </button>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, matric no, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
              )}
            </div>
            
            <button 
              className={`btn btn-outline btn-sm ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>

          {/* Expandable Filters */}
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
                <label>Semester</label>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  {uniqueSemesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Room Status</label>
                <select value={filterRoomStatus} onChange={(e) => setFilterRoomStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
              
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matric No</th>
                <th>Phone</th>
                <th>Semester</th>
                <th>Room</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.matric_no}</td>
                    <td>{student.phone || '-'}</td>
                    <td>{student.semester || '-'}</td>
                    <td>
                      {student.block ? (
                        <span className="badge badge-active">{student.block}-{student.room_no}</span>
                      ) : (
                        <span className="badge badge-pending">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewStudent(student)}
                          title="View Details"
                        >
                          <EyeIcon />
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => { 
                            setSelectedStudent(student); 
                            setShowModal(true); 
                            setSelectedRoom(student.room_id ? String(student.room_id) : ''); 
                          }}
                          title={student.room_id ? 'Change Room' : 'Assign Room'}
                        >
                          <RoomIcon />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteDialog({ isOpen: true, student })}
                          title="Delete Student"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <p className="empty-title">
                        {searchTerm || activeFiltersCount > 0 ? 'No students match your filters' : 'No students registered'}
                      </p>
                      {(searchTerm || activeFiltersCount > 0) && (
                        <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: '12px' }}>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            
            <div className="pagination-controls">
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="pagination-select"
              >
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              <div className="pagination-buttons">
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ««
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Room Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedStudent?.room_id ? 'Change Room' : 'Assign Room'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
                Assigning room for: <strong>{selectedStudent?.name}</strong>
              </p>
              {selectedStudent?.room_id && (
                <div className="info-box" style={{ marginBottom: '16px' }}>
                  <p><strong>Current Room:</strong> {selectedStudent.block}-{selectedStudent.room_no} (You are already here)</p>
                </div>
              )}
              <div className="form-group">
                <label>Select Room</label>
                <select 
                  value={selectedRoom} 
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="">Choose a room</option>
                  {rooms
                    .filter(r => r.status !== 'maintenance')
                    .filter(r => {
                      const isCurrentRoom = r.id === selectedStudent?.room_id;
                      // For current room, always show it
                      if (isCurrentRoom) return true;
                      // For other rooms, show if has space (or would have space after student moves out)
                      const effectiveOccupants = parseInt(r.occupants);
                      return effectiveOccupants < parseInt(r.capacity);
                    })
                    .sort((a, b) => {
                      if (a.block !== b.block) return a.block.localeCompare(b.block);
                      return a.room_no.localeCompare(b.room_no);
                    })
                    .map(room => {
                      const isCurrentRoom = room.id === selectedStudent?.room_id;
                      const occupants = parseInt(room.occupants);
                      const capacity = parseInt(room.capacity);
                      
                      return (
                        <option 
                          key={room.id} 
                          value={room.id}
                        >
                          {room.block}-{room.room_no} ({occupants}/{capacity})
                          {isCurrentRoom ? ' ✓ Current' : ''}
                        </option>
                      );
                    })}
                </select>
                <small style={{ color: 'var(--gray-500)', marginTop: '8px', display: 'block' }}>
                  Only rooms with available space are shown
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={confirmAssignRoom}
                disabled={!selectedRoom}
              >
                {selectedStudent?.room_id ? 'Change Room' : 'Assign Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Student Details</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>Matric No:</strong> {selectedStudent.matric_no}</p>
                <p><strong>Phone:</strong> {selectedStudent.phone || '-'}</p>
                <p><strong>IC Number:</strong> {selectedStudent.ic_number || '-'}</p>
                <p><strong>Semester:</strong> {selectedStudent.semester || '-'}</p>
                <p><strong>Program:</strong> {selectedStudent.program || '-'}</p>
                <p><strong>Room:</strong> {selectedStudent.block ? `${selectedStudent.block}-${selectedStudent.room_no}` : 'Not assigned'}</p>
              </div>
              {selectedStudent.address && (
                <div className="description-box">
                  <p className="label">Address:</p>
                  <p className="text">{selectedStudent.address}</p>
                </div>
              )}
              {selectedStudent.emergency_contact && (
                <div className="info-box">
                  <p><strong>Emergency Contact:</strong> {selectedStudent.emergency_contact} ({selectedStudent.emergency_phone})</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, roomId: null })}
        onConfirm={() => handleAssignRoom(confirmDialog.roomId)}
        title="Confirm Room Assignment"
        message={`Are you sure you want to assign this room to ${selectedStudent?.name}?`}
        confirmText="Assign"
        type="info"
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, student: null })}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteDialog.student?.name}" (${deleteDialog.student?.matric_no})? This action cannot be undone and will also delete all associated complaints.`}
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default AdminStudents;
