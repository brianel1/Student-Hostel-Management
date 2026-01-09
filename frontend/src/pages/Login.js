import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import logo from '../assets/logo.jpg';
import loginBg from '../assets/login-bg.jpg';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      if (response.data.success) {
        login(response.data.user);
        const user = response.data.user;
        if (user.role === 'student' && !user.profile_completed) {
          navigate('/student/profile-setup');
        } else {
          navigate(user.role === 'student' ? '/student/dashboard' : '/admin/dashboard');
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-image" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="login-image-overlay">
          <div className="login-image-content">
            <h2>Welcome to</h2>
            <h1>KKTM-Ledang Hostel</h1>
          </div>
        </div>
      </div>
      
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header compact">
            <img src={logo} alt="Logo" className="login-logo" />
            <h2>Sign In</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="compact-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Enter your username"
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <span>New to KKTM-Ledang?</span>
          </div>

          <div className="login-register-links">
            <Link to="/register/student" className="register-link">Register as Student</Link>
            <Link to="/register/warden" className="register-link secondary">Register as Warden</Link>
          </div>

          <div className="login-back">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
