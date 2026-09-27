import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingState } from '../booking-state';
import { BookingStepper } from '../shared/booking-stepper';
import { BookingRouteBar } from '../shared/booking-route-bar';

@Component({
  selector: 'app-date-select',
  standalone: true,
  imports: [FormsModule, BookingStepper, BookingRouteBar],
  templateUrl: './date-select.html',
  styleUrl: './date-select.css'
})
export class DateSelect {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly state = inject(BookingState);

  trainId = signal<number | null>(null);
  scheduleId = signal<number | null>(null);

  date = signal<string>('');
  readonly today = new Date().toISOString().slice(0, 10);

  constructor() {
    const trainId = Number(this.route.snapshot.paramMap.get('trainId'));
    const scheduleId = Number(this.route.snapshot.paramMap.get('scheduleId'));
    this.trainId.set(trainId);
    this.scheduleId.set(scheduleId);

    if (this.state.travelDate()) {
      this.date.set(this.state.travelDate()!);
    }

    // No coach chosen (e.g. hard refresh) -> go back to step 1
    if (!this.state.coach()) {
      this.router.navigate(['/booking', trainId, scheduleId, 'coach']);
    }
  }

  goToTrains(): void {
    this.router.navigate(['/trains', this.trainId()]);
  }

  goBack(): void {
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'coach']);
  }

  coachLabel(): string {
    const coach = this.state.coach();
    if (!coach) return '';
    const number = coach.number ?? coach.coachNumber;
    const cls = coach.type ?? coach.category ?? coach.class ?? 'class';
    return `Coach ${number ?? ''} — ${cls}`.trim();
  }

  continue(): void {
    if (!this.date()) return;
    this.state.setTravelDate(this.date());
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'seats']);
  }
}
