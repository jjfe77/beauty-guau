import React, { useState } from 'react';
import { Business, Pet, Service, SizeKey, Turno } from '../types';
import {
  fmtDateKey,
  hoursUntil,
  longDateLabel,
  money,
  NOW,
  NOW_MIN,
  parseDateKey,
  slotsForDate,
  statusLabel,
  toMin,
  toTime,
  upcomingDateList,
  weekdayNameOf,
  WEEKDAY_ES_SHORT,
} from '../data';

interface ClienteViewProps {
  currentClient: string;
  currentClientPhone: string;
  businesses: Business[];
  clientPets: Pet[];
  onAddPet: (pet: { name: string; size: SizeKey }) => Pet;
  onRemovePet: (petId: number) => void;
  turnos: Turno[];
  onAddTurno: (newTurno: Omit<Turno, 'id'>) => void;
  onCancelTurno: (turnoId: number) => void;
  onRequestReschedule: (turnoId: number) => void;
  onBackToRoles: () => void;
}

export const ClienteView: React.FC<ClienteViewProps> = ({
  currentClient,
  currentClientPhone,
  businesses,
  clientPets,
  onAddPet,
  onRemovePet,
  turnos,
  onAddTurno,
  onCancelTurno,
  onRequestReschedule,
  onBackToRoles,
}) => {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'misturnos' | 'mismascotas'>('nuevo');
  const [searchView, setSearchView] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking process state
  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

  // Inline pet creation in booking flow
  const [showInlinePetForm, setShowInlinePetForm] = useState(false);
  const [inlinePetName, setInlinePetName] = useState('');
  const [inlinePetSize, setInlinePetSize] = useState<SizeKey>('M');

  // Pet management in "Mis mascotas" tab
  const [newPetName, setNewPetName] = useState('');
  const [newPetSize, setNewPetSize] = useState<SizeKey>('M');

  // Booking confirmation screen
  const [lastConfirmedTurno, setLastConfirmedTurno] = useState<Turno | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Selected business object
  const selectedBiz = businesses.find((b) => b.id === selectedBizId) || null;

  // Filter businesses
  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.zone.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
    );
  });

  // Service & price calculations
  const selectedService = selectedBiz?.services.find((s) => s.id === selectedServiceId) || null;

  const currentDuration = (): number | null => {
    if (!selectedService) return null;
    if (selectedService.type === 'fixed') return selectedService.duration || null;
    return selectedSize && selectedService.sizes ? selectedService.sizes[selectedSize].duration : null;
  };

  const currentPrice = (): number | null => {
    if (!selectedService) return null;
    if (selectedService.type === 'fixed') return selectedService.price || null;
    return selectedSize && selectedService.sizes ? selectedService.sizes[selectedSize].price : null;
  };

  // Available slots for selected date
  const duration = currentDuration();
  const availableSlots =
    selectedBiz && selectedDate && duration
      ? slotsForDate(selectedBiz, selectedDate, duration, turnos)
      : [];

  const handleSelectBusiness = (bizId: number) => {
    setSelectedBizId(bizId);
    setSelectedServiceId(null);
    setSelectedSize(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedPetId(null);
    setShowConfirmation(false);
  };

  const handleBackToSearch = () => {
    setSelectedBizId(null);
    setSelectedServiceId(null);
    setSelectedSize(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedPetId(null);
    setShowConfirmation(false);
  };

  const handleSelectService = (s: Service) => {
    if (selectedServiceId === s.id) {
      setSelectedServiceId(null);
    } else {
      setSelectedServiceId(s.id);
    }
    setSelectedSize(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleSelectSize = (sz: SizeKey) => {
    setSelectedSize(sz);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedTime(null);
  };

  const handleSelectTime = (timeStr: string) => {
    setSelectedTime(timeStr);
  };

  const handleSaveInlinePet = () => {
    const trimmed = inlinePetName.trim();
    if (!trimmed) return;
    const pet = onAddPet({ name: trimmed, size: inlinePetSize });
    setSelectedPetId(pet.id);
    setInlinePetName('');
    setShowInlinePetForm(false);
  };

  const handleAddPetFromTab = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPetName.trim();
    if (!trimmed) return;
    onAddPet({ name: trimmed, size: newPetSize });
    setNewPetName('');
  };

  const canConfirm = Boolean(
    selectedBiz &&
      selectedService &&
      duration &&
      currentPrice() &&
      selectedDate &&
      selectedTime &&
      selectedPetId
  );

  const handleConfirmBooking = () => {
    if (!canConfirm || !selectedBiz || !selectedService || !selectedDate || !selectedTime) return;

    const pet = clientPets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    const price = currentPrice() || 0;
    const dur = duration || 30;

    const newTurnoData: Omit<Turno, 'id'> = {
      businessId: selectedBiz.id,
      businessName: selectedBiz.name,
      businessAddress: selectedBiz.address,
      businessPhone: selectedBiz.phone,
      serviceName: selectedService.name,
      sizeLabel: selectedService.type === 'sized' ? selectedSize : null,
      duration: dur,
      price,
      date: selectedDate,
      time: selectedTime,
      petName: pet.name,
      petSize: pet.size,
      clientName: currentClient,
      clientPhone: currentClientPhone,
      status: 'pendiente',
    };

    onAddTurno(newTurnoData);

    setLastConfirmedTurno({
      ...newTurnoData,
      id: Date.now(),
    });
    setShowConfirmation(true);
  };

  // Resets the state and unlocks the booking flow so the client can book another appointment!
  const handleBookAnotherSameBiz = () => {
    setSelectedServiceId(null);
    setSelectedSize(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedPetId(null);
    setShowConfirmation(false);
  };

  const handleBookAnotherNewBiz = () => {
    handleBackToSearch();
  };

  // Client turnos
  const myTurnos = turnos
    .filter((t) => t.clientName === currentClient && t.status !== 'reprogramado')
    .sort((a, b) => (a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date < b.date ? -1 : 1));

  return (
    <section className="view active" id="view-cliente">
      {/* Back to role selection button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <button className="back-btn" onClick={onBackToRoles} title="Volver al selector de perfiles">
          ← Volver al selector de perfiles
        </button>
        <span className="eyebrow" style={{ margin: 0 }}>Cliente</span>
      </div>

      <h2 style={{ marginBottom: '4px' }}>Beauty Guau</h2>
      <p className="muted" style={{ marginBottom: '14px', fontSize: '13px' }}>
        Hola, {currentClient}
      </p>

      {/* SUBTABS */}
      <div className="subtabs">
        <button
          className={activeTab === 'nuevo' ? 'active' : ''}
          onClick={() => {
            setActiveTab('nuevo');
          }}
        >
          Pedir turno
        </button>
        <button
          className={activeTab === 'misturnos' ? 'active' : ''}
          onClick={() => setActiveTab('misturnos')}
        >
          Mis turnos {myTurnos.length > 0 && `(${myTurnos.length})`}
        </button>
        <button
          className={activeTab === 'mismascotas' ? 'active' : ''}
          onClick={() => setActiveTab('mismascotas')}
        >
          Mis mascotas {clientPets.length > 0 && `(${clientPets.length})`}
        </button>
      </div>

      {/* TAB 1: PEDIR TURNO */}
      {activeTab === 'nuevo' && (
        <div className="subview active" id="clientesub-nuevo">
          {/* STEP 1: BUSCAR PELUQUERIA */}
          {!selectedBizId && !showConfirmation && (
            <div id="searchStep">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <div className="field-label" style={{ margin: 0 }}>
                  Elegí una peluquería
                </div>
                <div className="segmented">
                  <button
                    type="button"
                    className={searchView === 'list' ? 'active' : ''}
                    onClick={() => setSearchView('list')}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    className={searchView === 'map' ? 'active' : ''}
                    onClick={() => setSearchView('map')}
                  >
                    Mapa
                  </button>
                </div>
              </div>

              <div className="search-panel">
                <label className="search">
                  <span>🔎</span>
                  <input
                    placeholder="Buscar por nombre o zona"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </div>

              {searchView === 'list' ? (
                <div className="results-grid">
                  {filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((b) => (
                      <article
                        key={b.id}
                        className={`business-card ${selectedBizId === b.id ? 'selected' : ''}`}
                        onClick={() => handleSelectBusiness(b.id)}
                      >
                        <div className={`business-media ${b.cls}`}>{b.icon}</div>
                        <div className="business-body">
                          <h3>{b.name}</h3>
                          <p className="muted" style={{ fontSize: '12px' }}>
                            {b.address}
                          </p>
                          <div className="tags">
                            <span>{b.zone}</span>
                            <span>★ {b.rating}</span>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-hint">No encontramos peluquerías con esa búsqueda.</p>
                  )}
                </div>
              ) : (
                <div className="map-view active">
                  <div className="map-canvas">
                    <span className="map-block" style={{ left: '6%', top: '5%', width: '22%', height: '20%' }} />
                    <span className="map-block" style={{ left: '38%', top: '6%', width: '26%', height: '18%' }} />
                    <span className="map-block" style={{ left: '74%', top: '8%', width: '20%', height: '16%' }} />
                    <span className="map-block" style={{ left: '6%', top: '36%', width: '20%', height: '30%' }} />
                    <span className="map-block" style={{ left: '38%', top: '34%', width: '28%', height: '32%' }} />
                    <span className="map-block" style={{ left: '74%', top: '34%', width: '20%', height: '32%' }} />
                    <span className="map-block" style={{ left: '6%', top: '76%', width: '22%', height: '18%' }} />
                    <span className="map-block" style={{ left: '38%', top: '78%', width: '26%', height: '16%' }} />
                    <span className="map-block" style={{ left: '74%', top: '76%', width: '20%', height: '18%' }} />
                    <span className="map-street horizontal top" />
                    <span className="map-street horizontal bottom" />
                    <span className="map-street vertical left" />
                    <span className="map-street vertical right" />

                    {filteredBusinesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className={`map-pin ${selectedBizId === b.id ? 'selected' : ''}`}
                        style={{ left: `${b.x}%`, top: `${b.y}%` }}
                        onClick={() => handleSelectBusiness(b.id)}
                        title={b.name}
                      >
                        <span>{b.id}</span>
                      </button>
                    ))}
                  </div>

                  <div className="map-list">
                    {filteredBusinesses.map((b) => (
                      <article
                        key={b.id}
                        className={`map-card ${selectedBizId === b.id ? 'selected' : ''}`}
                        onClick={() => handleSelectBusiness(b.id)}
                      >
                        <strong>{b.name}</strong>
                        <p className="muted" style={{ fontSize: '12px' }}>
                          {b.zone} · ★ {b.rating}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BOOKING FLOW (WHEN BUSINESS IS SELECTED) */}
          {selectedBiz && !showConfirmation && (
            <div id="bookingFlow">
              {/* Back button to return to search */}
              <div style={{ marginBottom: 12 }}>
                <button
                  className="back-btn"
                  onClick={handleBackToSearch}
                  title="Volver al listado de peluquerías"
                >
                  ← Volver a peluquerías
                </button>
              </div>

              <div className="selected-biz-bar">
                <div>
                  <strong>{selectedBiz.name}</strong>
                  <br />
                  <span>{selectedBiz.address}</span>
                </div>
                <button className="change-btn" onClick={handleBackToSearch}>
                  Cambiar
                </button>
              </div>

              {/* 1. Elegí el servicio */}
              <div className="card">
                <div className="field-label">1. Elegí el servicio</div>
                <div id="servicePick">
                  {selectedBiz.services.length === 0 ? (
                    <p className="empty-hint">Esta peluquería todavía no cargó servicios.</p>
                  ) : (
                    selectedBiz.services.map((s) => {
                      const isActive = selectedServiceId === s.id;
                      const priceLabel =
                        s.type === 'fixed'
                          ? `${money(s.price || 0)} · ${s.duration} min`
                          : `desde ${money(
                              s.sizes
                                ? Math.min(
                                    ...(Object.values(s.sizes) as { price: number }[]).map(
                                      (v) => v.price
                                    )
                                  )
                                : 0
                            )} según talle`;

                      return (
                        <div
                          key={s.id}
                          className={`service-option ${isActive ? 'active' : ''}`}
                        >
                          <div
                            className="service-option-head"
                            onClick={() => handleSelectService(s)}
                          >
                            <div>
                              <strong>{s.name}</strong>
                              <br />
                              <span>
                                {s.type === 'fixed' ? 'precio único' : 'precio según talle'}
                              </span>
                            </div>
                            <span className="price">{priceLabel}</span>
                          </div>

                          {isActive && s.type === 'sized' && s.sizes && (
                            <div className="size-table">
                              <div className="size-table-row header">
                                <span>Talle</span>
                                <span>Duración</span>
                                <span>Precio</span>
                              </div>
                              {(Object.entries(s.sizes) as [SizeKey, { duration: number; price: number }][]).map(
                                ([k, v]) => (
                                  <div
                                    key={k}
                                    className={`size-table-row ${selectedSize === k ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectSize(k);
                                    }}
                                  >
                                    <b>{k}</b>
                                    <span>{v.duration} min</span>
                                    <span>{money(v.price)}</span>
                                  </div>
                                )
                              )}
                              <div className="extra-note">
                                ⚠️ Si tu mascota es más grande que el talle que elegís, se cobra un adicional al finalizar el servicio.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2. Elegí el día */}
              {selectedService && (selectedService.type === 'fixed' || selectedSize) && (
                <div className="card" id="dayCard">
                  <div className="field-label">2. Elegí el día</div>
                  <div className="date-row">
                    {upcomingDateList().map((d) => {
                      const key = fmtDateKey(d);
                      const sched = selectedBiz.schedule.find((sd) => sd.day === weekdayNameOf(d));
                      const closed = !sched || sched.closed;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`date-chip ${selectedDate === key ? 'active' : ''}`}
                          disabled={closed}
                          onClick={() => handleSelectDate(key)}
                        >
                          <small>{WEEKDAY_ES_SHORT[d.getDay()]}</small>
                          {d.getDate()}/{d.getMonth() + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Horarios disponibles */}
              {selectedDate && duration && (
                <div className="card" id="timeCard">
                  <div className="field-label">3. Horarios disponibles</div>
                  {availableSlots.length > 0 ? (
                    <div className="time-grid">
                      {availableSlots.map((sl) => (
                        <button
                          key={sl.label}
                          type="button"
                          className={`time-btn ${selectedTime === sl.label ? 'active' : ''}`}
                          disabled={sl.disabled}
                          onClick={() => handleSelectTime(sl.label)}
                        >
                          {sl.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="time-hint">
                      No hay horarios disponibles ese día para la duración de este servicio.
                    </p>
                  )}
                  <p className="time-hint">
                    Turnos de {duration} min según el servicio elegido. Los horarios tachados ya están ocupados o quedaron en el pasado.
                  </p>
                </div>
              )}

              {/* 4. Elegí tu mascota */}
              {selectedTime && (
                <div className="card" id="petCard">
                  <div className="field-label">4. Elegí tu mascota</div>
                  <div className="pet-chip-row">
                    {clientPets.length > 0 ? (
                      clientPets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`pet-chip ${selectedPetId === p.id ? 'active' : ''}`}
                          onClick={() => setSelectedPetId(p.id)}
                        >
                          🐾 {p.name} <span style={{ opacity: 0.75 }}>({p.size})</span>
                        </button>
                      ))
                    ) : (
                      <p className="empty-hint" style={{ padding: 0 }}>
                        Todavía no cargaste mascotas. Agregá una a continuación para poder reservar.
                      </p>
                    )}
                  </div>

                  {showInlinePetForm && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="grid2">
                        <input
                          type="text"
                          value={inlinePetName}
                          onChange={(e) => setInlinePetName(e.target.value)}
                          placeholder="Nombre de la mascota"
                        />
                        <select
                          value={inlinePetSize}
                          onChange={(e) => setInlinePetSize(e.target.value as SizeKey)}
                        >
                          <option value="XS">Talle XS</option>
                          <option value="S">Talle S</option>
                          <option value="M">Talle M</option>
                          <option value="L">Talle L</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="add-btn secondary"
                        style={{ marginTop: '8px' }}
                        onClick={handleSaveInlinePet}
                      >
                        Guardar mascota
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setShowInlinePetForm(!showInlinePetForm)}
                    >
                      {showInlinePetForm ? 'Ocultar formulario' : '+ Agregar una mascota nueva'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="confirm-btn"
                    disabled={!canConfirm}
                    onClick={handleConfirmBooking}
                  >
                    Pedir turno
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CONFIRMATION CARD (SOLUCIÓN AL BLOQUEO) */}
          {showConfirmation && lastConfirmedTurno && (
            <div className="card confirmation active" id="confirmationCard">
              <div className="check">✓</div>
              <h3>¡Turno pedido con éxito!</h3>
              <p className="muted" style={{ marginBottom: '20px', lineHeight: 1.6 }}>
                <b>{lastConfirmedTurno.petName}</b> — {lastConfirmedTurno.serviceName}
                {lastConfirmedTurno.sizeLabel ? ` · talle ${lastConfirmedTurno.sizeLabel}` : ''}
                <br />
                {longDateLabel(parseDateKey(lastConfirmedTurno.date))} {lastConfirmedTurno.time} hs —{' '}
                {money(lastConfirmedTurno.price)}
                <br />
                en <b>{lastConfirmedTurno.businessName}</b>, {lastConfirmedTurno.businessAddress}
              </p>

              {/* Action buttons that solve the lock and allow requesting another turno */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
                <button
                  type="button"
                  className="add-btn"
                  onClick={handleBookAnotherSameBiz}
                >
                  Pedir otro turno en esta peluquería
                </button>

                <button
                  type="button"
                  className="add-btn secondary"
                  onClick={handleBookAnotherNewBiz}
                >
                  🔍 Buscar otra peluquería
                </button>

                <button
                  type="button"
                  className="switch-role-btn"
                  style={{ marginTop: '6px' }}
                  onClick={() => setActiveTab('misturnos')}
                >
                  📋 Ver mis turnos agendados
                </button>

                <button
                  type="button"
                  className="back-btn"
                  style={{ alignSelf: 'center', marginTop: '6px' }}
                  onClick={handleBookAnotherNewBiz}
                >
                  ← Volver al inicio
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MIS TURNOS */}
      {activeTab === 'misturnos' && (
        <div className="subview active" id="clientesub-misturnos">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              className="back-btn"
              onClick={() => setActiveTab('nuevo')}
              title="Volver a pedir turno"
            >
              ← Volver a pedir turno
            </button>
          </div>

          <div className="now-pill">
            🕒 Hoy es <strong>{longDateLabel(NOW)} · {toTime(NOW_MIN)}</strong> (simulado para la demo)
          </div>

          <div className="card">
            <div id="misTurnosList">
              {myTurnos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p className="empty-hint">Todavía no pediste ningún turno.</p>
                  <button
                    className="add-btn"
                    style={{ maxWidth: '200px', margin: '12px auto 0' }}
                    onClick={() => setActiveTab('nuevo')}
                  >
                    Pedir un turno ahora
                  </button>
                </div>
              ) : (
                myTurnos.map((t) => {
                  const h = hoursUntil(t);
                  const canCancel = t.status === 'pendiente' && h >= 24;
                  const canReschedule = t.status === 'pendiente' && h >= 24;

                  return (
                    <div key={t.id} className="turno-row">
                      <div className="turno-row-top">
                        <div>
                          <strong>
                            {t.petName} — {t.serviceName}
                            {t.sizeLabel ? ` (${t.sizeLabel})` : ''}
                          </strong>
                          <span>
                            {t.businessName} · {longDateLabel(parseDateKey(t.date))} {t.time} hs ·{' '}
                            {money(t.price)}
                          </span>
                        </div>
                        <span className={`status-badge ${t.status}`}>{statusLabel(t.status)}</span>
                      </div>

                      {t.status === 'pendiente' && (
                        <div>
                          {canCancel || canReschedule ? (
                            <div className="turno-actions">
                              {canCancel && (
                                <button
                                  className="cancel-link-btn"
                                  onClick={() => onCancelTurno(t.id)}
                                >
                                  Cancelar turno
                                </button>
                              )}
                              {canReschedule && (
                                <button
                                  className="reschedule-link-btn"
                                  onClick={() => onRequestReschedule(t.id)}
                                >
                                  Reprogramar
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="cancel-note">
                              Faltan menos de 24 hs — ya no podés cancelar ni reprogramar desde la app. Llamá directamente a la peluquería al{' '}
                              <b>{t.businessPhone || 'el teléfono del negocio'}</b> para coordinar.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MIS MASCOTAS */}
      {activeTab === 'mismascotas' && (
        <div className="subview active" id="clientesub-mismascotas">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              className="back-btn"
              onClick={() => setActiveTab('nuevo')}
              title="Volver a pedir turno"
            >
              ← Volver a pedir turno
            </button>
          </div>

          <div className="card">
            <div className="field-label">Agregar mascota</div>
            <form onSubmit={handleAddPetFromTab}>
              <div className="grid2">
                <input
                  type="text"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="Nombre de tu mascota"
                  required
                />
                <select
                  value={newPetSize}
                  onChange={(e) => setNewPetSize(e.target.value as SizeKey)}
                >
                  <option value="XS">Talle XS</option>
                  <option value="S">Talle S</option>
                  <option value="M">Talle M</option>
                  <option value="L">Talle L</option>
                </select>
              </div>
              <button type="submit" className="add-btn" style={{ marginTop: '10px' }}>
                + Agregar mascota
              </button>
            </form>
          </div>

          <div className="card">
            <div className="field-label">Tus mascotas</div>
            <div>
              {clientPets.length === 0 ? (
                <p className="empty-hint">Todavía no cargaste ninguna mascota.</p>
              ) : (
                clientPets.map((p) => (
                  <div key={p.id} className="pet-row">
                    <div>
                      <strong>{p.name}</strong>
                      <br />
                      <span>Talle {p.size}</span>
                    </div>
                    <button
                      className="remove-btn"
                      title="Eliminar mascota"
                      onClick={() => onRemovePet(p.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
