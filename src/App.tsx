import React, { useState } from 'react';
import { Business, Pet, Role, ScreenMode, SizeKey, Turno, TurnoStatus } from './types';
import {
  hoursUntil,
  INITIAL_BUSINESSES,
  INITIAL_CLIENT_PETS,
  INITIAL_TURNOS,
} from './data';
import { Topbar } from './components/Topbar';
import { RoleScreen } from './components/RoleScreen';
import { NegocioIdScreen } from './components/NegocioIdScreen';
import { ClienteIdScreen } from './components/ClienteIdScreen';
import { NegocioView } from './components/NegocioView';
import { ClienteView } from './components/ClienteView';
import { RescheduleModal } from './components/RescheduleModal';

export default function App() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('role_select');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // Business state
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [currentBiz, setCurrentBiz] = useState<Business | null>(null);

  // Client state
  const [currentClient, setCurrentClient] = useState<string>('Ana Gómez');
  const [currentClientPhone, setCurrentClientPhone] = useState<string>('11 5555-0101');
  const [allPets, setAllPets] = useState<Record<string, Pet[]>>(INITIAL_CLIENT_PETS);

  // Turnos state
  const [turnos, setTurnos] = useState<Turno[]>(INITIAL_TURNOS);

  // Rescheduling modal state
  const [reschedulingTurnoId, setReschedulingTurnoId] = useState<number | null>(null);

  // Helper for pets
  const getPetsForClient = (clientName: string): Pet[] => {
    return allPets[clientName] || [];
  };

  const handleAddPet = (newPet: { name: string; size: SizeKey }): Pet => {
    const existing = getPetsForClient(currentClient);
    const created: Pet = {
      id: Date.now(),
      name: newPet.name,
      size: newPet.size,
    };
    setAllPets({
      ...allPets,
      [currentClient]: [...existing, created],
    });
    return created;
  };

  const handleRemovePet = (petId: number) => {
    const existing = getPetsForClient(currentClient);
    setAllPets({
      ...allPets,
      [currentClient]: existing.filter((p) => p.id !== petId),
    });
  };

  // Turno actions
  const handleAddTurno = (newTurnoData: Omit<Turno, 'id'>) => {
    const created: Turno = {
      ...newTurnoData,
      id: Date.now(),
    };
    setTurnos((prev) => [created, ...prev]);
  };

  const handleUpdateTurnoStatus = (turnoId: number, newStatus: TurnoStatus) => {
    setTurnos((prev) =>
      prev.map((t) => {
        if (t.id !== turnoId) return t;
        const nextStatus = t.status === newStatus ? 'pendiente' : newStatus;
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleCancelTurno = (turnoId: number, isBizContext = false) => {
    setTurnos((prev) =>
      prev.map((t) => {
        if (t.id !== turnoId) return t;
        const h = hoursUntil(t);
        if (isBizContext) {
          return {
            ...t,
            status: 'cancelado' as TurnoStatus,
            canceledBy: 'negocio',
            cancelReason:
              h < 24
                ? 'Cancelado por el negocio con menos de 24 hs — coordinado por teléfono con el cliente'
                : 'Cancelado por el negocio',
          };
        } else if (h >= 24) {
          return {
            ...t,
            status: 'cancelado' as TurnoStatus,
            canceledBy: 'cliente',
            cancelReason: 'Cancelado por el cliente desde la app',
          };
        }
        return t;
      })
    );
  };

  const handleConfirmReschedule = (newDate: string, newTime: string) => {
    if (!reschedulingTurnoId) return;
    const original = turnos.find((t) => t.id === reschedulingTurnoId);
    if (!original) return;

    const newTurno: Turno = {
      ...original,
      id: Date.now(),
      date: newDate,
      time: newTime,
      status: 'pendiente',
      rescheduledFrom: original.id,
    };

    setTurnos((prev) =>
      prev.map((t) => (t.id === original.id ? { ...t, status: 'reprogramado' as TurnoStatus } : t)).concat(newTurno)
    );
    setReschedulingTurnoId(null);
  };

  const handleUpdateBusiness = (updated: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (currentBiz?.id === updated.id) {
      setCurrentBiz(updated);
    }
  };

  const handleRegisterBusiness = (newBiz: Business) => {
    setBusinesses((prev) => [...prev, newBiz]);
    setCurrentBiz(newBiz);
    setCurrentRole('negocio');
    setScreenMode('app');
  };

  const handleLogout = () => {
    setCurrentBiz(null);
    setCurrentRole(null);
    setScreenMode('role_select');
  };

  const turnoToReschedule = turnos.find((t) => t.id === reschedulingTurnoId) || null;

  return (
    <div>
      {/* Topbar only shown when inside the application */}
      {screenMode === 'app' && <Topbar onLogout={handleLogout} />}

      {/* Screen 1: Role selection */}
      {screenMode === 'role_select' && (
        <RoleScreen
          onSelectRole={(role) => {
            if (role === 'negocio') {
              setScreenMode('negocio_select');
            } else {
              setScreenMode('cliente_login');
            }
          }}
        />
      )}

      {/* Screen 2: Negocio Selection with back button */}
      {screenMode === 'negocio_select' && (
        <NegocioIdScreen
          businesses={businesses}
          onSelectBusiness={(biz) => {
            setCurrentBiz(biz);
            setCurrentRole('negocio');
            setScreenMode('app');
          }}
          onRegisterBusiness={handleRegisterBusiness}
          onBack={() => setScreenMode('role_select')}
        />
      )}

      {/* Screen 3: Cliente Login with back button */}
      {screenMode === 'cliente_login' && (
        <ClienteIdScreen
          onLogin={(name, phone) => {
            setCurrentClient(name);
            setCurrentClientPhone(phone);
            if (!allPets[name]) {
              setAllPets((prev) => ({ ...prev, [name]: [] }));
            }
            setCurrentRole('cliente');
            setScreenMode('app');
          }}
          onBack={() => setScreenMode('role_select')}
        />
      )}

      {/* Screen 4: Main Application View */}
      {screenMode === 'app' && (
        <main>
          {currentRole === 'negocio' && currentBiz && (
            <NegocioView
              business={currentBiz}
              onUpdateBusiness={handleUpdateBusiness}
              turnos={turnos}
              onUpdateTurnoStatus={handleUpdateTurnoStatus}
              onCancelTurno={handleCancelTurno}
              onRequestReschedule={(id) => setReschedulingTurnoId(id)}
              onSwitchProfile={() => setScreenMode('negocio_select')}
            />
          )}

          {currentRole === 'cliente' && (
            <ClienteView
              currentClient={currentClient}
              currentClientPhone={currentClientPhone}
              businesses={businesses}
              clientPets={getPetsForClient(currentClient)}
              onAddPet={handleAddPet}
              onRemovePet={handleRemovePet}
              turnos={turnos}
              onAddTurno={handleAddTurno}
              onCancelTurno={(id) => handleCancelTurno(id, false)}
              onRequestReschedule={(id) => setReschedulingTurnoId(id)}
              onBackToRoles={() => setScreenMode('cliente_login')}
            />
          )}
        </main>
      )}

      {/* Reschedule Modal */}
      {turnoToReschedule && (
        <RescheduleModal
          turno={turnoToReschedule}
          businesses={businesses}
          allTurnos={turnos}
          onClose={() => setReschedulingTurnoId(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}
    </div>
  );
}
