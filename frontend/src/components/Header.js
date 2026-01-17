import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { BellIcon, LockIcon, LogoutIcon, ChevronDownIcon } from './Icons';
import { formatRelativeTime } from '../utils/dateUtils';

const Header = ({ title, onChangePassword }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll(user.id);
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      // Mark all as read when opening
      try {
        await notificationsAPI.markAllAsRead(user.id);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const formatTime = (dateStr) => {
    return formatRelativeTime(dateStr);
  };

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        {/* Notifications - Only for warden and superadmin */}
        {(user.role === 'warden' || user.role === 'superadmin') && (
          <div className="notification-dropdown" ref={notifRef}>
            <button className="notification-btn" onClick={handleOpenNotifications}>
              <BellIcon />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <span className="notification-count">{notifications.length}</span>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${notif.is_read ? '' : 'unread'}`}
                      >
                        <div className="notification-content">
                          <p className="notification-title">{notif.title}</p>
                          <p className="notification-message">{notif.message}</p>
                          <span className="notification-time">{formatTime(notif.created_at)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notification-empty">
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <button className="profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="profile-avatar">{getInitials(user?.name)}</div>
            <div className="profile-info">
              <div className="profile-name">{user?.name}</div>
              <div className="profile-role">{user?.role}</div>
            </div>
            <ChevronDownIcon />
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { onChangePassword(); setShowDropdown(false); }}>
                <LockIcon />
                Change Password
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item danger" onClick={logout}>
                <LogoutIcon />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
