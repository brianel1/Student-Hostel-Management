import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardIcon, UsersIcon, RoomIcon, ComplaintIcon, WardenIcon, PlusIcon, ProfileIcon, UploadIcon } from './Icons';
import logo from '../assets/logo.jpg';

const Sidebar = () => {
  const { user } = useAuth();

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/admin/students', label: 'Students', icon: <UsersIcon /> },
    { path: '/admin/rooms', label: 'Rooms', icon: <RoomIcon /> },
    { path: '/admin/complaints', label: 'Complaints', icon: <ComplaintIcon /> },
    { path: '/admin/import', label: 'Import Students', icon: <UploadIcon /> },
  ];

  const superadminLinks = [
    ...adminLinks,
    { path: '/admin/wardens', label: 'Wardens', icon: <WardenIcon /> },
  ];

  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { path: '/student/complaints', label: 'My Complaints', icon: <ComplaintIcon />, end: true },
    { path: '/student/complaints/new', label: 'New Complaint', icon: <PlusIcon /> },
    { path: '/student/profile', label: 'My Profile', icon: <ProfileIcon /> },
  ];

  const links = user?.role === 'student' 
    ? studentLinks 
    : user?.role === 'superadmin' 
      ? superadminLinks 
      : adminLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <div className="sidebar-brand">
          <h2 className="sidebar-title">KKTM-Ledang</h2>
          <p className="sidebar-subtitle">Hostel Management</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-section-title">Menu</p>
          {links.map(link => (
            <NavLink 
              key={link.path} 
              to={link.path} 
              end={link.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
