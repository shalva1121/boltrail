import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingState } from '../booking-state';
import { BookingService } from '../booking.service';
import { Seat } from '../../models/booking.model';
import { BookingStepper } from '../shared/booking-stepper';
import { BookingRouteBar } from '../shared/booking-route-bar';

@Component({
  selector: 'app-seat-select',
  standalone: true,
  imports: [BookingStepper, BookingRouteBar],
  templateUrl: './seat-select.html',
  styleUrl: './seat-select.css'
})
export class SeatSelect {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  readonly state = inject(BookingState);

  trainId = signal<number | null>(null);
  scheduleId = signal<number | null>(null);

  seats = signal<Seat[]>([]);
  loading = signal(true);
  error = signal('');

  selectedIds = signal<Set<number>>(new Set());

  readonly selectedCount = computed(() => this.selectedIds().size);

  constructor() {
    const trainId = Number(this.route.snapshot.paramMap.get('trainId'));
    const scheduleId = Number(this.route.snapshot.paramMap.get('scheduleId'));
    this.trainId.set(trainId);
    this.scheduleId.set(scheduleId);

    const coach = this.state.coach();
    const travelDate = this.state.travelDate();

    if (!coach?.id || !travelDate) {
      this.router.navigate(['/booking', trainId, scheduleId, coach?.id ? 'date' : 'coach']);
      return;
    }

    // restore previous seat selection if user is coming back to this step
    this.selectedIds.set(new Set(this.state.selectedSeats().map(s => s.id)));

    this.loadSeats(coach.id, scheduleId, travelDate);
  }

  private loadSeats(coachId: number, scheduleId: number, travelDate: string): void {
    this.loading.set(true);
    this.error.set('');
    this.bookingService.getMergedSeats(coachId, scheduleId, travelDate).subscribe({
      next: seats => {
        this.seats.set(seats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to load seats for this coach and date.');
      }
    });
  }

  coachLabel(): string {
    const coach = this.state.coach();
    if (!coach) return '';
    const number = coach.number ?? coach.coachNumber;
    const cls = coach.type ?? coach.category ?? coach.class ?? 'class';
    const date = this.state.travelDate() ?? '';
    return `Coach ${number ?? ''} — ${cls} • ${date}`.trim();
  }

  seatState(seat: Seat): 'available' | 'selected' | 'booked' {
    if (!seat.available) return 'booked';
    if (seat.id != null && this.selectedIds().has(seat.id)) return 'selected';
    return 'available';
  }

  toggleSeat(seat: Seat): void {
    if (!seat.available || seat.id == null) return;
    const next = new Set(this.selectedIds());
    if (next.has(seat.id)) {
      next.delete(seat.id);
    } else {
      next.add(seat.id);
    }
    this.selectedIds.set(next);
  }

  goToTrains(): void {
    this.router.navigate(['/trains', this.trainId()]);
  }

  goBack(): void {
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'date']);
  }

  review(): void {
    if (this.selectedCount() === 0) return;
    const chosen = this.seats()
      .filter(s => s.id != null && this.selectedIds().has(s.id))
      .map(s => ({ id: s.id as number, number: s.number ?? (s.id as number) }));

    this.state.setSeats(chosen);
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'confirm']);
  }

  trackBySeat(index: number, seat: Seat): number | string {
    return seat.id ?? seat.number ?? index;
  }
}
