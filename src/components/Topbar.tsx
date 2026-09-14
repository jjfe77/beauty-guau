import React from 'react';

interface TopbarProps {
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onLogout }) => {
  return (
    <header className="topbar" id="topbar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); }}>
        <span>🐾</span>Beauty Guau
      </a>
      <button className="switch-role-btn" id="switchRoleBtn" onClick={onLogout}>
        ← Cerrar sesión
      </button>
    </header>
  );
};
