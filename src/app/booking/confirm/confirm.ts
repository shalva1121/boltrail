import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingState } from '../booking-state';
import { BookingService } from '../booking.service';
import { BookingStepper } from '../shared/booking-stepper';
import { BookingRouteBar } from '../shared/booking-route-bar';

@Component({
  selector: 'app-booking-confirm',
  standalone: true,
  imports: [BookingStepper, BookingRouteBar],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css'
})
export class BookingConfirm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  readonly state = inject(BookingState);

  trainId = signal<number | null>(null);
  scheduleId = signal<number | null>(null);

  submitting = signal(false);
  error = signal('');
  success = signal(false);

  readonly seatLabel = computed(() =>
    this.state.selectedSeats().map(s => s.number).join(', ')
  );

  readonly pricePerSeat = computed(() => {
    const coach = this.state.coach();
    return coach?.price ?? coach?.fare ?? 0;
  });

  readonly total = computed(() => this.pricePerSeat() * this.state.selectedSeats().length);

  constructor() {
    const trainId = Number(this.route.snapshot.paramMap.get('trainId'));
    const scheduleId = Number(this.route.snapshot.paramMap.get('scheduleId'));
    this.trainId.set(trainId);
    this.scheduleId.set(scheduleId);

    if (!this.state.isReadyToConfirm()) {
      this.router.navigate(['/booking', trainId, scheduleId, 'coach']);
    }
  }

  coachLabel(): string {
    const coach = this.state.coach();
    if (!coach) return '';
    const number = coach.number ?? coach.coachNumber;
    const cls = coach.type ?? coach.category ?? coach.class ?? 'class';
    return `Coach ${number ?? ''} — ${cls}`.trim();
  }

  goBack(): void {
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'seats']);
  }

  goToTrains(): void {
    this.router.navigate(['/trains', this.trainId()]);
  }

  confirmBooking(): void {
    const scheduleId = this.state.schedule()?.id;
    const travelDate = this.state.travelDate();
    const seatIds = this.state.selectedSeats().map(s => s.id);

    if (!scheduleId || !travelDate || seatIds.length === 0) return;

    this.submitting.set(true);
    this.error.set('');

    const isoDate = new Date(travelDate).toISOString();

    this.bookingService.createBooking({ scheduleId, seatId: seatIds, travelDate: isoDate }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        this.state.reset();
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Booking failed. Please try again.');
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
