import React, { useState } from 'react';
import { Business, Service, SizeKey, Turno, TurnoStatus } from '../types';
import {
  hoursUntil,
  longDateLabel,
  money,
  NOW,
  NOW_MIN,
  parseDateKey,
  statusLabel,
  TODAY_KEY,
  toMin,
  toTime,
} from '../data';

interface NegocioViewProps {
  business: Business;
  onUpdateBusiness: (updated: Business) => void;
  turnos: Turno[];
  onUpdateTurnoStatus: (turnoId: number, newStatus: TurnoStatus) => void;
  onCancelTurno: (turnoId: number, isBizContext: boolean) => void;
  onRequestReschedule: (turnoId: number) => void;
  onSwitchProfile: () => void;
}

export const NegocioView: React.FC<NegocioViewProps> = ({
  business,
  onUpdateBusiness,
  turnos,
  onUpdateTurnoStatus,
  onCancelTurno,
  onRequestReschedule,
  onSwitchProfile,
}) => {
  const [subtab, setSubtab] = useState<'datos' | 'servicios' | 'agenda'>('datos');

  // Service form state
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'sized'>('fixed');
  const [fixedDuration, setFixedDuration] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [sizesState, setSizesState] = useState<Record<SizeKey, { duration: string; price: string }>>({
    XS: { duration: '30', price: '9000' },
    S: { duration: '45', price: '12000' },
    M: { duration: '60', price: '15000' },
    L: { duration: '90', price: '19000' },
  });

  // Business info handlers
  const handleInfoChange = (field: 'name' | 'address' | 'phone', val: string) => {
    onUpdateBusiness({
      ...business,
      [field]: val,
    });
  };

  const handleScheduleChange = (index: number, field: 'open' | 'close', val: string) => {
    const updatedSched = [...business.schedule];
    updatedSched[index] = {
      ...updatedSched[index],
      [field]: val,
    };
    onUpdateBusiness({
      ...business,
      schedule: updatedSched,
    });
  };

  const handleScheduleToggleClosed = (index: number, closed: boolean) => {
    const updatedSched = [...business.schedule];
    updatedSched[index] = {
      ...updatedSched[index],
      closed,
    };
    onUpdateBusiness({
      ...business,
      schedule: updatedSched,
    });
  };

  // Service handlers
  const startEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setPriceType(service.type);
    if (service.type === 'fixed') {
      setFixedDuration(service.duration?.toString() || '');
      setFixedPrice(service.price?.toString() || '');
    } else if (service.sizes) {
      setSizesState({
        XS: { duration: service.sizes.XS.duration.toString(), price: service.sizes.XS.price.toString() },
        S: { duration: service.sizes.S.duration.toString(), price: service.sizes.S.price.toString() },
        M: { duration: service.sizes.M.duration.toString(), price: service.sizes.M.price.toString() },
        L: { duration: service.sizes.L.duration.toString(), price: service.sizes.L.price.toString() },
      });
    }
  };

  const stopEditService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setFixedDuration('');
    setFixedPrice('');
    setPriceType('fixed');
  };

  const handleSaveService = () => {
    const trimmed = serviceName.trim();
    if (!trimmed) return;

    let updatedService: Service;
    if (priceType === 'fixed') {
      const dur = Number(fixedDuration);
      const prc = Number(fixedPrice);
      if (!dur || !prc) return;
      updatedService = {
        id: editingServiceId ?? business.nextId,
        name: trimmed,
        type: 'fixed',
        duration: dur,
        price: prc,
      };
    } else {
      const parsedSizes: Record<SizeKey, { duration: number; price: number }> = {
        XS: { duration: Number(sizesState.XS.duration) || 30, price: Number(sizesState.XS.price) || 9000 },
        S: { duration: Number(sizesState.S.duration) || 45, price: Number(sizesState.S.price) || 12000 },
        M: { duration: Number(sizesState.M.duration) || 60, price: Number(sizesState.M.price) || 15000 },
        L: { duration: Number(sizesState.L.duration) || 90, price: Number(sizesState.L.price) || 19000 },
      };
      updatedService = {
        id: editingServiceId ?? business.nextId,
        name: trimmed,
        type: 'sized',
        sizes: parsedSizes,
      };
    }

    let nextServices: Service[];
    let nextId = business.nextId;
    if (editingServiceId) {
      nextServices = business.services.map((s) => (s.id === editingServiceId ? updatedService : s));
    } else {
      nextServices = [...business.services, updatedService];
      nextId++;
    }

    onUpdateBusiness({
      ...business,
      services: nextServices,
      nextId,
    });
    stopEditService();
  };

  const handleRemoveService = (id: number) => {
    const nextServices = business.services.filter((s) => s.id !== id);
    if (editingServiceId === id) {
      stopEditService();
    }
    onUpdateBusiness({
      ...business,
      services: nextServices,
    });
  };

  // Turnos for this business
  const bizTurnos = turnos.filter((t) => t.businessId === business.id);
  const todayTurnos = bizTurnos
    .filter((t) => t.date === TODAY_KEY && t.status !== 'reprogramado')
    .sort((a, b) => toMin(a.time) - toMin(b.time));
  const upcomingTurnos = bizTurnos
    .filter((t) => t.date > TODAY_KEY && t.status !== 'reprogramado')
    .sort((a, b) => (a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date < b.date ? -1 : 1));

  // Group upcoming by date
  const upcomingGroups: { dateKey: string; label: string; items: Turno[] }[] = [];
  upcomingTurnos.forEach((t) => {
    let group = upcomingGroups.find((g) => g.dateKey === t.date);
    if (!group) {
      group = { dateKey: t.date, label: longDateLabel(parseDateKey(t.date)), items: [] };
      upcomingGroups.push(group);
    }
    group.items.push(t);
  });

  const renderTurnoRow = (t: Turno) => {
    const h = hoursUntil(t);
    const withinWindow = h >= 24;
    return (
      <div key={t.id} className="turno-row">
        <div className="turno-row-top">
          <div>
            <strong>
              {t.time} · {t.petName} — {t.serviceName}
              {t.sizeLabel ? ` (${t.sizeLabel})` : ''}
            </strong>
            <span>{money(t.price)}</span>
          </div>
          <span className={`status-badge ${t.status}`}>{statusLabel(t.status)}</span>
        </div>
        <p className="turno-phone">
          📞 Cliente: <b>{t.clientPhone || 'sin teléfono'}</b>
        </p>

        {(t.status === 'pendiente' || t.status === 'asistio' || t.status === 'no_asistio') && (
          <div className="turno-actions">
            <button
              className={`outcome-btn asistio ${t.status === 'asistio' ? 'active asistio' : ''}`}
              onClick={() => onUpdateTurnoStatus(t.id, 'asistio')}
            >
              Asistió
            </button>
            <button
              className={`outcome-btn no_asistio ${t.status === 'no_asistio' ? 'active no_asistio' : ''}`}
              onClick={() => onUpdateTurnoStatus(t.id, 'no_asistio')}
            >
              No asistió
            </button>
          </div>
        )}

        {t.status === 'pendiente' && (
          <div className="turno-actions">
            <button className="cancel-link-btn" onClick={() => onCancelTurno(t.id, true)}>
              Cancelar turno
            </button>
            <button className="reschedule-link-btn" onClick={() => onRequestReschedule(t.id)}>
              Reprogramar
            </button>
          </div>
        )}

        {t.status === 'pendiente' && !withinWindow && (
          <p className="cancel-note">
            Faltan menos de 24 hs. El cliente ya no puede cancelar desde la app — si llamó para avisar, cancelalo vos desde acá; queda registrado como cancelado por el negocio, coordinado por teléfono.
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="view active" id="view-negocio">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <button className="back-btn" onClick={onSwitchProfile} title="Volver a seleccionar peluquería o rol">
          ← Volver al selector de peluquerías
        </button>
        <span className="eyebrow" style={{ margin: 0 }}>Panel Negocio</span>
      </div>

      <h2 style={{ marginBottom: '18px' }}>Configurá tu peluquería ({business.name})</h2>

      <div className="subtabs">
        <button
          className={subtab === 'datos' ? 'active' : ''}
          onClick={() => setSubtab('datos')}
        >
          Datos y horarios
        </button>
        <button
          className={subtab === 'servicios' ? 'active' : ''}
          onClick={() => setSubtab('servicios')}
        >
          Servicios
        </button>
        <button
          className={subtab === 'agenda' ? 'active' : ''}
          onClick={() => setSubtab('agenda')}
        >
          Agenda
        </button>
      </div>

      {/* SUBVIEW DATOS */}
      {subtab === 'datos' && (
        <div className="subview active" id="sub-datos">
          <div className="card">
            <div className="field-label">Nombre de la peluquería</div>
            <input
              type="text"
              value={business.name}
              onChange={(e) => handleInfoChange('name', e.target.value)}
            />
            <div className="field-label" style={{ marginTop: '14px' }}>
              Domicilio
            </div>
            <input
              type="text"
              value={business.address}
              onChange={(e) => handleInfoChange('address', e.target.value)}
            />
            <div className="field-label" style={{ marginTop: '14px' }}>
              Teléfono de contacto
            </div>
            <input
              type="tel"
              value={business.phone || ''}
              onChange={(e) => handleInfoChange('phone', e.target.value)}
            />
            <p className="field-hint">
              Este teléfono queda visible para el cliente si necesita coordinar una cancelación con menos de 24 hs de anticipación.
            </p>
          </div>

          <div className="card">
            <div className="field-label">Horarios de atención</div>
            <div id="scheduleList">
              {business.schedule.map((d, i) => (
                <div key={d.day} className="schedule-row">
                  <strong>{d.day}</strong>
                  <input
                    type="time"
                    value={d.open}
                    disabled={d.closed}
                    onChange={(e) => handleScheduleChange(i, 'open', e.target.value)}
                  />
                  <input
                    type="time"
                    value={d.close}
                    disabled={d.closed}
                    onChange={(e) => handleScheduleChange(i, 'close', e.target.value)}
                  />
                  <label className="closed-toggle">
                    <input
                      type="checkbox"
                      checked={d.closed}
                      onChange={(e) => handleScheduleToggleClosed(i, e.target.checked)}
                    />{' '}
                    Cerrado
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW SERVICIOS */}
      {subtab === 'servicios' && (
        <div className="subview active" id="sub-servicios">
          <div className="card">
            {editingServiceId && (
              <div className="editing-banner">
                <span>✏️ Editando servicio</span>
                <button className="link-btn" onClick={stopEditService}>
                  Cancelar edición
                </button>
              </div>
            )}
            <div className="field-label">
              {editingServiceId ? 'Editar servicio' : 'Nuevo servicio'}
            </div>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Nombre (ej. Baño + corte)"
              style={{ marginBottom: '12px' }}
            />
            <div className="type-toggle">
              <button
                type="button"
                className={priceType === 'fixed' ? 'active' : ''}
                onClick={() => setPriceType('fixed')}
              >
                Precio único (igual para todos)
              </button>
              <button
                type="button"
                className={priceType === 'sized' ? 'active' : ''}
                onClick={() => setPriceType('sized')}
              >
                Precio y duración por tamaño
              </button>
            </div>

            {priceType === 'fixed' ? (
              <div className="grid2">
                <div>
                  <div className="field-label">Duración (min)</div>
                  <input
                    type="number"
                    value={fixedDuration}
                    onChange={(e) => setFixedDuration(e.target.value)}
                    placeholder="15"
                  />
                </div>
                <div>
                  <div className="field-label">Precio ($)</div>
                  <input
                    type="number"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="3500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div
                  className="size-input-row"
                  style={{
                    fontWeight: 800,
                    fontSize: '11px',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Talle</span>
                  <span>Duración (min)</span>
                  <span>Precio ($)</span>
                </div>
                {(['XS', 'S', 'M', 'L'] as SizeKey[]).map((sz) => (
                  <div key={sz} className="size-input-row">
                    <span>{sz}</span>
                    <input
                      type="number"
                      value={sizesState[sz].duration}
                      onChange={(e) =>
                        setSizesState({
                          ...sizesState,
                          [sz]: { ...sizesState[sz], duration: e.target.value },
                        })
                      }
                      placeholder="30"
                    />
                    <input
                      type="number"
                      value={sizesState[sz].price}
                      onChange={(e) =>
                        setSizesState({
                          ...sizesState,
                          [sz]: { ...sizesState[sz], price: e.target.value },
                        })
                      }
                      placeholder="9000"
                    />
                  </div>
                ))}
              </div>
            )}

            <button className="add-btn" onClick={handleSaveService}>
              {editingServiceId ? 'Guardar cambios' : '+ Agregar servicio'}
            </button>
          </div>

          <div className="card">
            <div className="field-label">Servicios cargados</div>
            <p className="field-hint" style={{ marginBottom: '10px' }}>
              Editar un servicio no modifica los turnos ya reservados: cada turno guarda una copia del talle, la duración y el precio vigentes al momento de la reserva.
            </p>
            <div>
              {business.services.length === 0 ? (
                <p className="empty-hint">Todavía no cargaste ningún servicio.</p>
              ) : (
                business.services.map((s) => (
                  <div
                    key={s.id}
                    className={`service-row ${editingServiceId === s.id ? 'editing' : ''}`}
                  >
                    <div className="service-row-head">
                      <strong>{s.name}</strong>
                      <div className="service-row-actions">
                        <button
                          className="edit-btn"
                          title="Editar"
                          onClick={() => startEditService(s)}
                        >
                          ✎
                        </button>
                        <button
                          className="remove-btn"
                          title="Eliminar"
                          onClick={() => handleRemoveService(s.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {s.type === 'fixed' ? (
                      <div className="size-detail">
                        <span>{s.duration} min</span>
                        <span>
                          <b>{money(s.price || 0)}</b> · precio único
                        </span>
                      </div>
                    ) : (
                      <div className="size-detail">
                        {s.sizes &&
                          (Object.entries(s.sizes) as [SizeKey, { duration: number; price: number }][]).map(
                            ([k, v]) => (
                              <span key={k}>
                                {k}: {v.duration} min · <b>{money(v.price)}</b>
                              </span>
                            )
                          )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW AGENDA */}
      {subtab === 'agenda' && (
        <div className="subview active" id="sub-agenda">
          <div className="now-pill">
            🕒 Hoy es <strong>{longDateLabel(NOW)} · {toTime(NOW_MIN)}</strong> (simulado para la demo)
          </div>

          <div className="card">
            <div className="field-label">Turnos de hoy</div>
            <div>
              {todayTurnos.length > 0 ? (
                todayTurnos.map(renderTurnoRow)
              ) : (
                <p className="empty-hint">No tenés turnos para hoy.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="field-label">Próximos turnos</div>
            <div>
              {upcomingGroups.length > 0 ? (
                upcomingGroups.map((g) => (
                  <div key={g.dateKey}>
                    <div className="day-group-label">{g.label}</div>
                    {g.items.map(renderTurnoRow)}
                  </div>
                ))
              ) : (
                <p className="empty-hint">No hay próximos turnos agendados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
