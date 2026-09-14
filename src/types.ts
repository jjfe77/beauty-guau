export type Role = 'negocio' | 'cliente';
export type ScreenMode = 'role_select' | 'negocio_select' | 'cliente_login' | 'app';

export interface ScheduleDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export type SizeKey = 'XS' | 'S' | 'M' | 'L';

export interface ServiceSizeDetail {
  duration: number;
  price: number;
}

export interface Service {
  id: number;
  name: string;
  type: 'fixed' | 'sized';
  duration?: number;
  price?: number;
  sizes?: Record<SizeKey, ServiceSizeDetail>;
}

export interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  zone: string;
  rating: string;
  icon: string;
  cls: string;
  x: number;
  y: number;
  schedule: ScheduleDay[];
  services: Service[];
  nextId: number;
}

export interface Pet {
  id: number;
  name: string;
  size: SizeKey;
}

export type TurnoStatus = 'pendiente' | 'asistio' | 'no_asistio' | 'cancelado' | 'reprogramado';

export interface Turno {
  id: number;
  businessId: number;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  serviceName: string;
  sizeLabel: string | null;
  duration: number;
  price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  petName: string;
  petSize: string;
  clientName: string;
  clientPhone: string;
  status: TurnoStatus;
  canceledBy?: 'negocio' | 'cliente';
  cancelReason?: string;
  rescheduledFrom?: number;
}

export interface BookingState {
  businessId: number | null;
  serviceId: number | null;
  size: SizeKey | null;
  date: string | null;
  time: string | null;
  petId: number | null;
}
