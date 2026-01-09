import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import loginBg from '../assets/login-bg.jpg';

const Landing = () => {
  return (
    <div className="landing-split">
      <div className="landing-image" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="landing-image-overlay">
          <div className="landing-image-content">
            <h2>Welcome to</h2>
            <h1>KKTM-Ledang Hostel</h1>
            <div className="landing-features">
              <div className="landing-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Room Management</span>
              </div>
              <div className="landing-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Complaint System</span>
              </div>
              <div className="landing-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-form-section">
        <div className="landing-form-container">
          <div className="landing-header">
            <img src={logo} alt="Logo" className="landing-logo-small" />
            <h1>KKTM-Ledang</h1>
            <p>Hostel Management System</p>
          </div>

          <div className="landing-actions">
            <Link to="/login" className="landing-btn primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </Link>
            
            <div className="landing-divider">
              <span>or create an account</span>
            </div>

            <Link to="/register/student" className="landing-btn outline">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Register as Student
            </Link>
            
            <Link to="/register/warden" className="landing-btn outline secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Register as Warden
            </Link>
          </div>

          <div className="landing-footer">
            <p>© 2026 KKTM-Ledang. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
