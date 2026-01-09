import React from 'react';
import { AlertIcon, CloseIcon } from './Icons';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // warning, danger, info
}) => {
  if (!isOpen) return null;

  const colors = {
    warning: { bg: '#fef3c7', color: '#d97706', btnBg: '#f59e0b' },
    danger: { bg: '#fee2e2', color: '#dc2626', btnBg: '#ef4444' },
    info: { bg: '#dbeafe', color: '#2563eb', btnBg: '#3b82f6' }
  };

  const style = colors[type] || colors.warning;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '16px',
            padding: '16px',
            background: style.bg,
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ color: style.color, flexShrink: 0 }}>
              <AlertIcon />
            </div>
            <p style={{ color: 'var(--gray-700)', margin: 0 }}>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>{cancelText}</button>
          <button 
            className="btn" 
            style={{ background: style.btnBg, color: 'white' }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
