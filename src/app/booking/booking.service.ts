import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CreateBookingPayload, Seat } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'https://trainsapi.stepacademy.ge/api';

  /** All physical seats that exist in a coach */
  getCoachSeats(coachId: number): Observable<Seat[]> {
    return this.http.get<any>(`${this.apiUrl}/seats/coach/${coachId}`).pipe(
      map(raw => this.normalizeSeats(raw)),
      catchError(err => throwError(() => err))
    );
  }

  /** Which seat IDs are booked for a given schedule + date */
  getBookedSeatIds(scheduleId: number, coachId: number, travelDate: string, allSeatIds: number[]): Observable<Set<number>> {
    const url = `${this.apiUrl}/seats/availability?scheduleId=${scheduleId}&coachId=${coachId}&travelDate=${encodeURIComponent(travelDate)}`;
    return this.http.get<any>(url).pipe(
      map(raw => this.normalizeAvailability(raw, allSeatIds)),
      catchError(err => throwError(() => err))
    );
  }

  createBooking(payload: CreateBookingPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings`, payload, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getUserBookings(page = 1, take = 1): Observable<any[]> {
    const url = `${this.apiUrl}/bookings?Take=${take}&Page=${page}`;
    return this.http.get<any>(url, this.authHeaders()).pipe(
      map(raw => this.normalizeBookings(raw)),
      catchError(err => throwError(() => err))
    );
  }

  /** Bookings filtered by travel date range, using the dedicated filter endpoint */
  getUserBookingsFiltered(from: string, to: string, take = 12, page = 1): Observable<any[]> {
    const url = `${this.apiUrl}/bookings/filter?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&Take=${take}&Page=${page}`;
    return this.http.get<any>(url, this.authHeaders()).pipe(
      map(raw => this.normalizeBookings(raw)),
      catchError(err => throwError(() => err))
    );
  }

  getBookingById(bookingId: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bookings/${bookingId}`, this.authHeaders()).pipe(
      map(raw => this.normalizeBooking(raw)),
      catchError(err => throwError(() => err))
    );
  }

  deleteBooking(bookingId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/bookings/${bookingId}`, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** Updates a booking (used for changing the travel date) */
  updateBooking(bookingId: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bookings/${bookingId}`, payload, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** One call that returns the fully merged, render-ready seat list */
  getMergedSeats(coachId: number, scheduleId: number, travelDate: string): Observable<Seat[]> {
    return forkJoin({
      seats: this.getCoachSeats(coachId),
      raw: this.http.get<any>(
        `${this.apiUrl}/seats/availability?scheduleId=${scheduleId}&coachId=${coachId}&travelDate=${encodeURIComponent(travelDate)}`
      )
    }).pipe(
      map(({ seats, raw }) => {
        const allIds = seats.map(s => s.id).filter((id): id is number => id != null);
        const booked = this.normalizeAvailability(raw, allIds);
        return seats.map(s => ({ ...s, available: s.id != null ? !booked.has(s.id) : true }));
      }),
      catchError(err => throwError(() => err))
    );
  }

  private authHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  private normalizeBooking(raw: any): any {
    const data = raw?.data ?? raw;
    return data && typeof data === 'object' ? data : null;
  }

  private normalizeBookings(raw: any): any[] {
    const data = raw?.data ?? raw;
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  }

  /** Unwrap + normalize the coach seat list into a flat array regardless of API response shape */
  private normalizeSeats(raw: any): Seat[] {
    const data = raw?.data ?? raw;
    let list: any[] = [];

    if (Array.isArray(data)) list = data;
    else if (Array.isArray(data?.items)) list = data.items;
    else if (Array.isArray(data?.data)) list = data.data;

    return list.map(item => ({
      id: item?.id ?? item?.seatId,
      number: item?.number ?? item?.seatNumber ?? item?.label ?? item?.id ?? item?.seatId,
      row: item?.row,
      col: item?.col ?? item?.column,
      available: true
    }));
  }

  /**
   * Returns the set of seat IDs that are BOOKED (unavailable) for the given schedule/date.
   * Handles a few possible response shapes from the API:
   *  - an object with `bookedSeats` / `availableSeats` arrays
   *  - a flat array of seat objects with an `isAvailable` / `isBooked` / `status` flag
   *  - a flat array of seat IDs representing the seats that ARE available
   */
  private normalizeAvailability(raw: any, allSeatIds: number[]): Set<number> {
    const data = raw?.data ?? raw;
    const booked = new Set<number>();

    const extractId = (item: any): number | null => {
      if (typeof item === 'number') return item;
      const id = item?.id ?? item?.seatId;
      return typeof id === 'number' ? id : null;
    };

    if (Array.isArray(data?.bookedSeats)) {
      data.bookedSeats.forEach((item: any) => {
        const id = extractId(item);
        if (id != null) booked.add(id);
      });
      return booked;
    }

    if (Array.isArray(data?.availableSeats)) {
      const availableIds = new Set(data.availableSeats.map(extractId).filter((id: number | null): id is number => id != null));
      allSeatIds.forEach(id => {
        if (!availableIds.has(id)) booked.add(id);
      });
      return booked;
    }

    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

    if (list.length && typeof list[0] === 'object') {
      list.forEach(item => {
        const id = extractId(item);
        if (id == null) return;
        const isAvailable = item?.isAvailable ?? item?.available ?? (item?.status ? String(item.status).toLowerCase() === 'available' : undefined);
        const isBooked = item?.isBooked ?? (item?.status ? String(item.status).toLowerCase() === 'booked' : undefined);
        if (isBooked === true || isAvailable === false) {
          booked.add(id);
        }
      });
      return booked;
    }

    // Plain array of numbers/ids => the seats that ARE available; everything else is booked.
    const availableIds = new Set(list.map(extractId).filter((id): id is number => id != null));
    if (availableIds.size > 0) {
      allSeatIds.forEach(id => {
        if (!availableIds.has(id)) booked.add(id);
      });
    }

    return booked;
  }
}
