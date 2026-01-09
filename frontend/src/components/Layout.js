import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChangePasswordModal from './ChangePasswordModal';

const Layout = ({ children, title }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Header title={title} onChangePassword={() => setShowPasswordModal(true)} />
        <div className="page-content">
          {children}
        </div>
      </main>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default Layout;
