import { Business, Pet, ScheduleDay, Turno, TurnoStatus } from './types';

export function baseSchedule(satClose: string): ScheduleDay[] {
  return [
    { day: 'Lunes', open: '09:00', close: '18:00', closed: false },
    { day: 'Martes', open: '09:00', close: '18:00', closed: false },
    { day: 'Miércoles', open: '09:00', close: '18:00', closed: false },
    { day: 'Jueves', open: '09:00', close: '18:00', closed: false },
    { day: 'Viernes', open: '09:00', close: '18:00', closed: false },
    { day: 'Sábado', open: '09:00', close: satClose, closed: false },
    { day: 'Domingo', open: '', close: '', closed: true },
  ];
}

export const WEEKDAY_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const WEEKDAY_ES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Simulación de "Ahora" para la demo
export const NOW = new Date();
NOW.setHours(11, 0, 0, 0);
export const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes();

export function fmtDateKey(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function weekdayNameOf(date: Date): string {
  return WEEKDAY_ES[date.getDay()];
}

export function shortDateLabel(date: Date): string {
  return `${WEEKDAY_ES_SHORT[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

export function longDateLabel(date: Date): string {
  return `${WEEKDAY_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}`;
}

export const TODAY_KEY = fmtDateKey(NOW);
export const UPCOMING_DAYS = 14;

export function upcomingDateList(): Date[] {
  const list: Date[] = [];
  for (let i = 0; i < UPCOMING_DAYS; i++) {
    list.push(addDays(NOW, i));
  }
  return list;
}

export function money(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(v);
}

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function toTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function statusLabel(status: TurnoStatus): string {
  const map: Record<TurnoStatus, string> = {
    pendiente: 'Pendiente',
    asistio: 'Asistió',
    no_asistio: 'No asistió',
    cancelado: 'Cancelado',
    reprogramado: 'Reprogramado',
  };
  return map[status] || status;
}

export function turnoDateTime(t: Turno): Date {
  const d = parseDateKey(t.date);
  d.setHours(Math.floor(toMin(t.time) / 60), toMin(t.time) % 60, 0, 0);
  return d;
}

export function hoursUntil(turno: Turno): number {
  return (turnoDateTime(turno).getTime() - NOW.getTime()) / 3600000;
}

export function isPastMoment(dateKey: string, startMin: number): boolean {
  if (dateKey < TODAY_KEY) return true;
  if (dateKey === TODAY_KEY && startMin <= NOW_MIN) return true;
  return false;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const BLOCKING_STATUSES: TurnoStatus[] = ['pendiente', 'asistio', 'no_asistio'];

export function isRangeTaken(
  allTurnos: Turno[],
  businessId: number,
  dateKey: string,
  startMin: number,
  endMin: number,
  excludeTurnoId?: number
): boolean {
  return allTurnos.some(
    (t) =>
      t.businessId === businessId &&
      t.date === dateKey &&
      t.id !== excludeTurnoId &&
      BLOCKING_STATUSES.includes(t.status) &&
      overlaps(startMin, endMin, toMin(t.time), toMin(t.time) + t.duration)
  );
}

export interface SlotInfo {
  start: number;
  label: string;
  disabled: boolean;
  reason: 'pasado' | 'ocupado' | null;
}

export function slotsForDate(
  biz: Business,
  dateKey: string,
  duration: number,
  allTurnos: Turno[],
  excludeTurnoId?: number
): SlotInfo[] {
  const date = parseDateKey(dateKey);
  const sched = biz.schedule.find((d) => d.day === weekdayNameOf(date));
  if (!sched || sched.closed || !duration) return [];
  const openMin = toMin(sched.open);
  const closeMin = toMin(sched.close);
  const slots: SlotInfo[] = [];
  for (let t = openMin; t + duration <= closeMin; t += 15) {
    const taken = isRangeTaken(allTurnos, biz.id, dateKey, t, t + duration, excludeTurnoId);
    const past = isPastMoment(dateKey, t);
    slots.push({
      start: t,
      label: toTime(t),
      disabled: taken || past,
      reason: past ? 'pasado' : taken ? 'ocupado' : null,
    });
  }
  return slots;
}

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 1,
    name: 'Patitas Spa',
    address: 'Av. Santa Fe 3200, Palermo',
    phone: '11 4821-3300',
    zone: 'Palermo',
    rating: '4.9 (128)',
    icon: '✂',
    cls: 'scissors',
    x: 32,
    y: 30,
    schedule: baseSchedule('13:00'),
    services: [
      {
        id: 1,
        name: 'Baño + corte',
        type: 'sized',
        sizes: {
          XS: { duration: 30, price: 9000 },
          S: { duration: 45, price: 12000 },
          M: { duration: 60, price: 15000 },
          L: { duration: 90, price: 19000 },
        },
      },
      { id: 2, name: 'Corte de uñas', type: 'fixed', duration: 15, price: 3500 },
    ],
    nextId: 3,
  },
  {
    id: 2,
    name: 'Vet & Groom Norte',
    address: 'Av. Cabildo 2100, Belgrano',
    phone: '11 4780-6650',
    zone: 'Belgrano',
    rating: '4.8 (94)',
    icon: '⚕',
    cls: 'vet',
    x: 70,
    y: 45,
    schedule: baseSchedule('14:00'),
    services: [
      {
        id: 1,
        name: 'Baño medicado',
        type: 'sized',
        sizes: {
          XS: { duration: 35, price: 10500 },
          S: { duration: 50, price: 13500 },
          M: { duration: 65, price: 16500 },
          L: { duration: 95, price: 21000 },
        },
      },
      { id: 2, name: 'Control post-baño', type: 'fixed', duration: 20, price: 4500 },
    ],
    nextId: 3,
  },
  {
    id: 3,
    name: 'Guau Club',
    address: 'Av. Las Heras 1900, Recoleta',
    phone: '11 4802-9910',
    zone: 'Recoleta',
    rating: '4.7 (76)',
    icon: '🫧',
    cls: 'bath',
    x: 50,
    y: 78,
    schedule: baseSchedule('13:30'),
    services: [
      {
        id: 1,
        name: 'Spa completo',
        type: 'sized',
        sizes: {
          XS: { duration: 40, price: 11000 },
          S: { duration: 55, price: 14000 },
          M: { duration: 70, price: 17500 },
          L: { duration: 100, price: 22500 },
        },
      },
      { id: 2, name: 'Cepillado', type: 'fixed', duration: 20, price: 4000 },
    ],
    nextId: 3,
  },
];

export const INITIAL_TURNOS: Turno[] = [
  {
    id: 1,
    businessId: 1,
    businessName: 'Patitas Spa',
    businessAddress: 'Av. Santa Fe 3200, Palermo',
    businessPhone: '11 4821-3300',
    serviceName: 'Baño + corte',
    sizeLabel: 'S',
    duration: 45,
    price: 12000,
    date: fmtDateKey(NOW),
    time: '12:45',
    petName: 'Toby',
    petSize: 'S',
    clientName: 'Ana Gómez',
    clientPhone: '11 5555-0101',
    status: 'pendiente',
  },
  {
    id: 2,
    businessId: 1,
    businessName: 'Patitas Spa',
    businessAddress: 'Av. Santa Fe 3200, Palermo',
    businessPhone: '11 4821-3300',
    serviceName: 'Corte de uñas',
    sizeLabel: null,
    duration: 15,
    price: 3500,
    date: fmtDateKey(NOW),
    time: '09:00',
    petName: 'Mora',
    petSize: 'XS',
    clientName: 'Ana Gómez',
    clientPhone: '11 5555-0101',
    status: 'asistio',
  },
  {
    id: 3,
    businessId: 1,
    businessName: 'Patitas Spa',
    businessAddress: 'Av. Santa Fe 3200, Palermo',
    businessPhone: '11 4821-3300',
    serviceName: 'Baño + corte',
    sizeLabel: 'M',
    duration: 60,
    price: 15000,
    date: fmtDateKey(addDays(NOW, 1)),
    time: '09:30',
    petName: 'Simón',
    petSize: 'M',
    clientName: 'Diego Ríos',
    clientPhone: '11 5555-0202',
    status: 'pendiente',
  },
  {
    id: 4,
    businessId: 1,
    businessName: 'Patitas Spa',
    businessAddress: 'Av. Santa Fe 3200, Palermo',
    businessPhone: '11 4821-3300',
    serviceName: 'Baño + corte',
    sizeLabel: 'L',
    duration: 90,
    price: 19000,
    date: fmtDateKey(addDays(NOW, 2)),
    time: '10:15',
    petName: 'Luna',
    petSize: 'L',
    clientName: 'Ana Gómez',
    clientPhone: '11 5555-0101',
    status: 'pendiente',
  },
];

export const INITIAL_CLIENT_PETS: Record<string, Pet[]> = {
  'Ana Gómez': [
    { id: 1, name: 'Toby', size: 'S' },
    { id: 2, name: 'Luna', size: 'L' },
  ],
};
