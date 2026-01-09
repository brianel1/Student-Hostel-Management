import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI } from '../../services/api';
import { ElectricIcon, WaterIcon, FurnitureIcon, WifiIcon, OtherIcon, UploadIcon } from '../../components/Icons';

const NewComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ category: '', priority: 'medium', description: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const categories = [
    { value: 'electric', label: 'Electric', desc: 'Lights, fans, sockets', icon: <ElectricIcon /> },
    { value: 'water', label: 'Water', desc: 'Pipes, taps, leaks', icon: <WaterIcon /> },
    { value: 'furniture', label: 'Furniture', desc: 'Beds, chairs, tables', icon: <FurnitureIcon /> },
    { value: 'internet', label: 'Internet', desc: 'WiFi, network issues', icon: <WifiIcon /> },
    { value: 'other', label: 'Other', desc: 'Other issues', icon: <OtherIcon /> }
  ];

  const validateForm = () => {
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return false;
    }
    return true;
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setError('');
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await complaintsAPI.create({
        ...formData,
        student_id: user.student_id,
        room_id: user.room_id
      });

      if (response.data.success) {
        const complaintId = response.data.id;
        for (const image of images) {
          const formDataImg = new FormData();
          formDataImg.append('complaint_id', complaintId);
          formDataImg.append('image', image);
          await complaintsAPI.uploadImage(formDataImg);
        }
        navigate('/student/complaints');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout title="Submit Complaint">
      <div className="card" style={{ maxWidth: '700px' }}>
        <div className="card-header">
          <h3 className="card-title">New Complaint</h3>
        </div>
        <div className="card-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmitClick}>
            <div className="form-group">
              <label>Category *</label>
              <div className="category-grid">
                {categories.map(cat => (
                  <div 
                    key={cat.value}
                    className={`category-card ${formData.category === cat.value ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, category: cat.value})}
                  >
                    <div className="icon">{cat.icon}</div>
                    <span className="label">{cat.label}</span>
                    <span className="desc">{cat.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Priority *</label>
              <div className="priority-options">
                {['low', 'medium', 'high'].map(p => (
                  <div 
                    key={p}
                    className={`priority-option ${formData.priority === p ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, priority: p})}
                  >
                    <span className={`priority-${p}`} style={{ textTransform: 'capitalize' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your complaint in detail (minimum 10 characters)..."
              />
            </div>

            <div className="form-group">
              <label>Upload Images (Optional, max 5)</label>
              <div className="upload-area" onClick={() => document.getElementById('imageInput').click()}>
                <input id="imageInput" type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                <div className="upload-icon"><UploadIcon /></div>
                <p className="upload-text">Click to upload images</p>
                <p className="upload-hint">PNG, JPG up to 5MB each</p>
              </div>
              
              {images.length > 0 && (
                <div className="image-preview">
                  {images.map((img, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={URL.createObjectURL(img)} alt="Preview" />
                      <button type="button" className="image-remove" onClick={() => removeImage(idx)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit Complaint"
        message={`Are you sure you want to submit this ${formData.priority} priority ${formData.category} complaint?`}
        confirmText="Submit"
        type="info"
      />
    </Layout>
  );
};

export default NewComplaint;
