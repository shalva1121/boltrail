import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainsService } from '../../services/trains.service';
import { TrainCoach } from '../../models/train.model';
import { BookingState } from '../booking-state';
import { BookingStepper } from '../shared/booking-stepper';
import { BookingRouteBar } from '../shared/booking-route-bar';

const HEAD_IMG = 'https://trains.stepacademy.ge/1.webp';
const BODY_IMG = 'https://trains.stepacademy.ge/2.webp';
const TAIL_IMG = 'https://trains.stepacademy.ge/3.webp';

@Component({
  selector: 'app-coach-select',
  standalone: true,
  imports: [BookingStepper, BookingRouteBar],
  templateUrl: './coach-select.html',
  styleUrl: './coach-select.css'
})
export class CoachSelect {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly trainsService = inject(TrainsService);
  readonly state = inject(BookingState);

  readonly headImg = HEAD_IMG;
  readonly bodyImg = BODY_IMG;
  readonly tailImg = TAIL_IMG;

  coaches = signal<TrainCoach[]>([]);
  loading = signal(true);
  error = signal('');

  trainId = signal<number | null>(null);
  scheduleId = signal<number | null>(null);

  constructor() {
    const trainId = Number(this.route.snapshot.paramMap.get('trainId'));
    const scheduleId = Number(this.route.snapshot.paramMap.get('scheduleId'));
    this.trainId.set(trainId);
    this.scheduleId.set(scheduleId);

    // Make sure the route summary bar has something to show even on a hard refresh
    if (!this.state.schedule() || this.state.trainId() !== trainId) {
      this.hydrateSchedule(trainId, scheduleId);
    }

    this.loadCoaches(trainId);
  }

  private hydrateSchedule(trainId: number, scheduleId: number): void {
    this.trainsService.getTrainSchedules(trainId).subscribe({
      next: schedules => {
        const match = schedules.find(s => s.id === scheduleId) ?? schedules[0];
        if (match) {
          this.state.setSchedule(trainId, {
            id: match.id,
            trainId,
            origin: match.origin,
            destination: match.destination,
            departureTime: match.departureTime
          });
        }
      },
      error: () => {}
    });
  }

  private loadCoaches(trainId: number): void {
    if (!Number.isFinite(trainId) || trainId <= 0) {
      this.error.set('Invalid train.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.trainsService.getTrainCoaches(trainId).subscribe({
      next: items => {
        this.coaches.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to load coaches for this train.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/trains', this.trainId()]);
  }

  coachClass(item: TrainCoach): string {
    return item.type ?? item.category ?? item.class ?? 'Coach';
  }

  coachSeats(item: TrainCoach): string {
    const s = item.seats ?? item.capacity ?? null;
    return s != null ? `${s} seats` : '— seats';
  }

  coachPrice(item: TrainCoach): string {
    const p = item.price ?? item.fare ?? null;
    return p != null ? `$${p}` : '—';
  }

  selectCoach(item: TrainCoach): void {
    this.state.setCoach(item);
    this.router.navigate(['/booking', this.trainId(), this.scheduleId(), 'date']);
  }

  trackByCoach(_: number, item: TrainCoach): number | string | null {
    return item.id ?? item.number ?? item.coachNumber ?? null;
  }
}
