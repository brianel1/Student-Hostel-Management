import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

const StudentProfile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    semester: '',
    program: '',
    ic_number: '',
    address: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile(user.id);
      if (response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          semester: data.semester || '',
          program: data.program || '',
          ic_number: data.ic_number || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10,12}$/.test(formData.phone.replace(/[-\s]/g, ''))) 
      newErrors.phone = 'Invalid phone number';
    
    if (!formData.ic_number.trim()) newErrors.ic_number = 'IC Number is required';
    else if (!/^\d{6}-\d{2}-\d{4}$/.test(formData.ic_number)) 
      newErrors.ic_number = 'Format: 000000-00-0000';
    
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (!formData.program.trim()) newErrors.program = 'Program is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.emergency_contact.trim()) newErrors.emergency_contact = 'Emergency contact is required';
    if (!formData.emergency_phone.trim()) newErrors.emergency_phone = 'Emergency phone is required';
    else if (!/^[0-9]{10,12}$/.test(formData.emergency_phone.replace(/[-\s]/g, ''))) 
      newErrors.emergency_phone = 'Invalid phone number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await authAPI.updateProfile({
        user_id: user.id,
        student_id: profile.student_id,
        ...formData,
        profile_completed: 1
      });

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        login({ ...user, profile_completed: 1, name: formData.name });
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="My Profile"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout title="My Profile">
      <div className="card" style={{ maxWidth: '800px' }}>
        <div className="card-header">
          <h3 className="card-title">Profile Information</h3>
        </div>
        <div className="card-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                <strong>Matric No:</strong> {profile?.matric_no} &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>Room:</strong> {profile?.block ? `${profile.block}-${profile.room_no}` : 'Not Assigned'}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={errors.phone ? 'error' : ''}
                  required
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>IC Number *</label>
                <input
                  type="text"
                  value={formData.ic_number}
                  onChange={(e) => setFormData({...formData, ic_number: e.target.value})}
                  placeholder="000000-00-0000"
                  className={errors.ic_number ? 'error' : ''}
                  required
                />
                {errors.ic_number && <span className="field-error">{errors.ic_number}</span>}
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  className={errors.semester ? 'error' : ''}
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                {errors.semester && <span className="field-error">{errors.semester}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Program *</label>
              <input
                type="text"
                value={formData.program}
                onChange={(e) => setFormData({...formData, program: e.target.value})}
                placeholder="e.g., Diploma Teknologi Maklumat"
                className={errors.program ? 'error' : ''}
                required
              />
              {errors.program && <span className="field-error">{errors.program}</span>}
            </div>

            <div className="form-group">
              <label>Home Address *</label>
              <textarea
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter your full home address"
                className={errors.address ? 'error' : ''}
                required
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <h4 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--gray-700)' }}>Emergency Contact</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name *</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  placeholder="Parent/Guardian name"
                  className={errors.emergency_contact ? 'error' : ''}
                  required
                />
                {errors.emergency_contact && <span className="field-error">{errors.emergency_contact}</span>}
              </div>
              <div className="form-group">
                <label>Contact Phone *</label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  placeholder="Phone number"
                  className={errors.emergency_phone ? 'error' : ''}
                  required
                />
                {errors.emergency_phone && <span className="field-error">{errors.emergency_phone}</span>}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          <ConfirmDialog
            isOpen={confirmDialog}
            onClose={() => setConfirmDialog(false)}
            onConfirm={handleConfirmSave}
            title="Save Profile"
            message="Are you sure you want to save your profile changes?"
            confirmText="Save"
            type="info"
          />
        </div>
      </div>
    </Layout>
  );
};

export default StudentProfile;
