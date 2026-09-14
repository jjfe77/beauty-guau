import React, { useState } from 'react';
import { Business, Turno } from '../types';
import {
  fmtDateKey,
  slotsForDate,
  upcomingDateList,
  weekdayNameOf,
  WEEKDAY_ES_SHORT,
} from '../data';

interface RescheduleModalProps {
  turno: Turno;
  businesses: Business[];
  allTurnos: Turno[];
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  turno,
  businesses,
  allTurnos,
  onClose,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const biz = businesses.find((b) => b.id === turno.businessId);

  const upcoming = upcomingDateList();

  const slots =
    biz && selectedDate
      ? slotsForDate(biz, selectedDate, turno.duration, allTurnos, turno.id)
      : [];

  const handleDateSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedTime(null);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime);
    }
  };

  return (
    <div
      className="modal-overlay"
      id="rescheduleModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <h3>Reprogramar turno</h3>
            <p className="muted" id="rescheduleSummary" style={{ fontSize: '12px' }}>
              {turno.petName} — {turno.serviceName}
              {turno.sizeLabel ? ` (${turno.sizeLabel})` : ''} · {turno.businessName}
            </p>
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="field-label">Nuevo día</div>
        <div className="date-row" style={{ marginBottom: '14px' }}>
          {upcoming.map((d) => {
            const key = fmtDateKey(d);
            const sched = biz?.schedule.find((sd) => sd.day === weekdayNameOf(d));
            const closed = !sched || sched.closed;
            return (
              <button
                key={key}
                type="button"
                className={`date-chip ${selectedDate === key ? 'active' : ''}`}
                disabled={closed}
                onClick={() => handleDateSelect(key)}
              >
                <small>{WEEKDAY_ES_SHORT[d.getDay()]}</small>
                {d.getDate()}/{d.getMonth() + 1}
              </button>
            );
          })}
        </div>

        <div className="field-label">Nuevo horario</div>
        {selectedDate ? (
          slots.length > 0 ? (
            <div className="time-grid">
              {slots.map((sl) => (
                <button
                  key={sl.label}
                  type="button"
                  className={`time-btn ${selectedTime === sl.label ? 'active' : ''}`}
                  disabled={sl.disabled}
                  onClick={() => setSelectedTime(sl.label)}
                >
                  {sl.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="time-hint">
              No hay horarios disponibles ese día para la duración de este servicio.
            </p>
          )
        ) : (
          <p className="time-hint">Elegí un día para ver los horarios disponibles.</p>
        )}

        {selectedDate && slots.length > 0 && (
          <p className="time-hint">
            Turnos de {turno.duration} min. Los horarios tachados ya están ocupados o quedaron en el pasado.
          </p>
        )}

        <button
          className="confirm-btn"
          disabled={!selectedDate || !selectedTime}
          onClick={handleConfirm}
        >
          Confirmar nuevo horario
        </button>
      </div>
    </div>
  );
};
