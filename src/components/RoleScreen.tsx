import React from 'react';
import { Role } from '../types';

interface RoleScreenProps {
  onSelectRole: (role: Role) => void;
  onResetData?: () => void;
}

export const RoleScreen: React.FC<RoleScreenProps> = ({ onSelectRole, onResetData }) => {
  return (
    <div className="role-screen" id="roleScreen">
      <span className="eyebrow">Bienvenido</span>
      <h1>¿Cómo querés entrar?</h1>
      <p>Elegí tu perfil para continuar</p>
      <div className="role-cards">
        <div className="role-card" data-role="negocio" onClick={() => onSelectRole('negocio')}>
          <div className="role-icon">✂️</div>
          <strong>Soy la peluquería</strong>
          <span>Cargá tus servicios, horarios y gestioná tu agenda</span>
        </div>
        <div className="role-card" data-role="cliente" onClick={() => onSelectRole('cliente')}>
          <div className="role-icon">🐾</div>
          <strong>Soy cliente</strong>
          <span>Buscá una peluquería y pedí un turno para tu mascota</span>
        </div>
      </div>
      {onResetData && (
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={onResetData}
            style={{
              background: 'transparent',
              border: '1px dashed var(--border)',
              color: 'var(--muted)',
              borderRadius: '99px',
              padding: '6px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ↺ Restablecer datos iniciales de prueba
          </button>
        </div>
      )}
    </div>
  );
};
