export interface BookingSchedule {
  id?: number;
  trainId?: number;
  origin?: string;
  destination?: string;
  departureTime?: string;
}

export interface Seat {
  id?: number;
  number?: number | string;
  row?: number;
  col?: number;
  available: boolean;
}

export interface CreateBookingPayload {
  scheduleId: number;
  seatId: number[];
  travelDate: string;
}
