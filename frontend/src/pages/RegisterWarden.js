import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.jpg';
import loginBg from '../assets/login-bg.jpg';
import { AlertIcon } from '../components/Icons';

const RegisterWarden = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', staff_id: '', role: 'warden'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.staff_id.trim()) newErrors.staff_id = 'Staff ID is required';
    else if (!/^[A-Z]{3}\d{3}$/i.test(formData.staff_id)) 
      newErrors.staff_id = 'Invalid format (e.g., WRD001)';
    if (formData.phone && !/^[0-9]{10,12}$/.test(formData.phone.replace(/[-\s]/g, ''))) 
      newErrors.phone = 'Invalid phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) 
      newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-image" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="login-image-overlay">
          <div className="login-image-content">
            <h1>Warden Registration</h1>
          </div>
        </div>
      </div>
      
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header compact">
            <img src={logo} alt="Logo" className="login-logo" />
            <h2>Create Account</h2>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="compact-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Staff ID</label>
              <input
                type="text"
                value={formData.staff_id}
                onChange={(e) => setFormData({...formData, staff_id: e.target.value.toUpperCase()})}
                placeholder="Enter your Staff ID"
                className={errors.staff_id ? 'error' : ''}
              />
              {errors.staff_id && <span className="field-error">{errors.staff_id}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter your phone number"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Min 6 characters"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="info-notice compact">
              <AlertIcon />
              <span>Account requires SuperAdmin approval</span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="login-back">
            <Link to="/login">Already have an account? Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWarden;
