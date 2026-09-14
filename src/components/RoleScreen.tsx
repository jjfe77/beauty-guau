import React from 'react';
import { Role } from '../types';

interface RoleScreenProps {
  onSelectRole: (role: Role) => void;
}

export const RoleScreen: React.FC<RoleScreenProps> = ({ onSelectRole }) => {
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
    </div>
  );
};
