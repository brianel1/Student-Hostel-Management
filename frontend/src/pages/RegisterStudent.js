import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.jpg';
import loginBg from '../assets/login-bg.jpg';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', matric_no: '', role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.matric_no.trim()) newErrors.matric_no = 'Matric number is required';
    else if (!/^[A-Z]{2}\d{5}$/i.test(formData.matric_no)) 
      newErrors.matric_no = 'Invalid format (e.g., DB82925)';
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
        setTimeout(() => navigate('/login'), 2000);
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
            <h1>Student Registration</h1>
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
              <label>Matric Number</label>
              <input
                type="text"
                value={formData.matric_no}
                onChange={(e) => setFormData({...formData, matric_no: e.target.value.toUpperCase()})}
                placeholder="Enter your Matric Number"
                className={errors.matric_no ? 'error' : ''}
              />
              {errors.matric_no && <span className="field-error">{errors.matric_no}</span>}
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

export default RegisterStudent;
