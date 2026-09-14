import React, { useState } from 'react';

interface ClienteIdScreenProps {
  onLogin: (name: string, phone: string) => void;
  onBack: () => void;
}

export const ClienteIdScreen: React.FC<ClienteIdScreenProps> = ({ onLogin, onBack }) => {
  const [name, setName] = useState('Ana Gómez');
  const [phone, setPhone] = useState('11 5555-0101');
  const [email, setEmail] = useState('ana@email.com');
  const [password, setPassword] = useState('123456');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onLogin(trimmedName, phone.trim() || '11 5555-0101');
  };

  return (
    <div className="role-screen" id="clienteIdScreen">
      <div style={{ marginBottom: 16 }}>
        <button className="back-btn" onClick={onBack} title="Volver al selector de perfiles">
          ← Volver
        </button>
      </div>
      <span className="eyebrow">Cliente · Ingresar</span>
      <h1>Iniciá sesión</h1>
      <p>Así identificamos tus turnos, tus mascotas y no se mezclan con los de otros clientes</p>
      
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '340px', textAlign: 'left', width: '100%' }}>
        <div className="field-label">Tu nombre</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Ana Gómez"
          style={{ marginBottom: '10px' }}
          required
        />
        <div className="field-label">Teléfono</div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej. 11 5555-0101"
          style={{ marginBottom: '10px' }}
        />
        <div className="field-label">Email</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          style={{ marginBottom: '10px' }}
        />
        <div className="field-label">Contraseña</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{ marginBottom: '10px' }}
        />
        <button type="submit" className="add-btn">
          Ingresar
        </button>
        <p className="login-note">
          Login simulado para la demo. En producción, el ingreso se hace con autenticación real (Auth0 / Firebase Auth) desde v1.
        </p>
      </form>
    </div>
  );
};
