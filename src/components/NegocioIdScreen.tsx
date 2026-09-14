import React, { useState } from 'react';
import { Business } from '../types';
import { baseSchedule } from '../data';

interface NegocioIdScreenProps {
  businesses: Business[];
  onSelectBusiness: (biz: Business) => void;
  onRegisterBusiness: (biz: Business) => void;
  onBack: () => void;
}

export const NegocioIdScreen: React.FC<NegocioIdScreenProps> = ({
  businesses,
  onSelectBusiness,
  onRegisterBusiness,
  onBack,
}) => {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRegister = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newBiz: Business = {
      id: Date.now(),
      name: trimmed,
      address: 'Dirección a definir',
      phone: newPhone.trim() || 'Sin teléfono',
      zone: 'Zona a definir',
      rating: 'Nuevo',
      icon: '🐾',
      cls: 'scissors',
      x: 50,
      y: 50,
      schedule: baseSchedule('13:00'),
      services: [],
      nextId: 1,
    };
    onRegisterBusiness(newBiz);
  };

  return (
    <div className="role-screen" id="negocioIdScreen">
      <div style={{ marginBottom: 16 }}>
        <button className="back-btn" onClick={onBack} title="Volver al selector de perfiles">
          ← Volver
        </button>
      </div>
      <span className="eyebrow">Negocio · Ingresar</span>
      <h1>¿Cuál es tu peluquería?</h1>
      <p>Elegí la tuya para entrar a su panel, o registrá una nueva</p>
      
      <div className="role-cards" id="bizIdList">
        {businesses.map((b) => (
          <div
            key={b.id}
            className="role-card"
            style={{ width: '180px' }}
            onClick={() => onSelectBusiness(b)}
          >
            <div className="role-icon">{b.icon}</div>
            <strong>{b.name}</strong>
            <span>{b.zone}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: '340px', marginTop: '24px', textAlign: 'left', width: '100%' }}>
        <div className="field-label">Registrar una peluquería nueva</div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de tu peluquería"
          style={{ marginBottom: '10px' }}
        />
        <input
          type="tel"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="Teléfono de contacto"
          style={{ marginBottom: '10px' }}
        />
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          style={{ marginBottom: '10px' }}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Contraseña"
          style={{ marginBottom: '10px' }}
        />
        <button className="add-btn" onClick={handleRegister}>
          Registrar y entrar
        </button>
        <p className="login-note">
          Login simulado para la demo. En producción, el alta y el ingreso se hacen con autenticación real (Auth0 / Firebase Auth) desde v1.
        </p>
      </div>
    </div>
  );
};
