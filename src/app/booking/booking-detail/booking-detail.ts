import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.css'
})
export class BookingDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);

  bookingId = this.route.snapshot.paramMap.get('id') ?? '';

  booking = signal<any>(null);
  loading = signal(false);
  error = signal('');

  deleting = signal(false);
  deleteError = signal('');

  showChangeDate = signal(false);
  newDate = signal('');
  savingDate = signal(false);
  changeDateError = signal('');

  constructor() {
    this.loadBooking();
  }

  loadBooking(): void {
    if (!this.bookingId) {
      this.error.set('Booking not found.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: booking => {
        this.loading.set(false);
        this.booking.set(booking);
      },
      error: err => {
        this.loading.set(false);
        const errorBody = err?.error;
        this.error.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to load booking details.'
        );
      }
    });
  }

  get b(): any {
    return this.booking() ?? {};
  }

  origin(): string {
    return this.b.schedule?.origin || this.b.origin || 'Unknown';
  }

  destination(): string {
    return this.b.schedule?.destination || this.b.destination || 'Unknown';
  }

  trainName(): string {
    return this.b.train?.name || this.b.trainName || this.b.schedule?.trainName || 'N/A';
  }

  departureTime(): string {
    return this.b.schedule?.departureTime || this.b.departureTime || 'N/A';
  }

  coachLabel(): string {
    const number = this.b.coach?.number || this.b.coachNumber || this.b.coach || 'N/A';
    const cls = this.b.coach?.class || this.b.coachClass || this.b.class || '';
    return cls ? `${number} — ${cls}` : `${number}`;
  }

  price(): string {
    return this.b.price || this.b.totalPrice || this.b.amount || 'N/A';
  }

  seat(): string {
    return this.b.seatNumber || this.b.seat?.number || this.b.seatId || 'N/A';
  }

  travelDate(): string {
    const raw = this.b.travelDate || this.b.schedule?.departureDate;
    return this.formatLongDate(raw) || 'N/A';
  }

  bookedOn(): string {
    const raw = this.b.createdAt || this.b.createdOn || this.b.bookedOn;
    return this.formatLongDate(raw) || 'N/A';
  }

  private formatLongDate(value: string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  goBack(): void {
    this.router.navigate(['/profile'], { queryParams: { tab: 'bookings' } });
  }

  openChangeDate(): void {
    this.changeDateError.set('');
    const raw = this.b.travelDate || this.b.schedule?.departureDate;
    this.newDate.set(raw ? String(raw).slice(0, 10) : '');
    this.showChangeDate.set(true);
  }

  cancelChangeDate(): void {
    this.showChangeDate.set(false);
  }

  saveNewDate(): void {
    if (!this.newDate()) {
      this.changeDateError.set('Please choose a date.');
      return;
    }

    this.savingDate.set(true);
    this.changeDateError.set('');

    const payload = {
      ...this.b,
      travelDate: this.newDate()
    };

    this.bookingService.updateBooking(this.bookingId, payload).subscribe({
      next: () => {
        this.savingDate.set(false);
        this.showChangeDate.set(false);
        this.loadBooking();
      },
      error: err => {
        this.savingDate.set(false);
        const errorBody = err?.error;
        this.changeDateError.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to update travel date.'
        );
      }
    });
  }

  deleteBooking(): void {
    this.deleting.set(true);
    this.deleteError.set('');

    this.bookingService.deleteBooking(this.bookingId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/profile'], { queryParams: { tab: 'bookings' } });
      },
      error: err => {
        this.deleting.set(false);
        const errorBody = err?.error;
        this.deleteError.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to delete booking.'
        );
      }
    });
  }
}
