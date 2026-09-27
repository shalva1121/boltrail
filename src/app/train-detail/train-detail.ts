import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainsService } from '../services/trains.service';
import { Train, TrainCoach, TrainSchedule } from '../models/train.model';
import { BookingState } from '../booking/booking-state';

@Component({
  selector: 'app-train-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './train-detail.html',
  styleUrl: './train-detail.css'
})
export class TrainDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly trainsService = inject(TrainsService);
  private readonly bookingState = inject(BookingState);

  train = signal<Train | null>(null);
  schedules = signal<TrainSchedule[]>([]);
  coaches = signal<TrainCoach[]>([]);
  activeTab = signal<'schedules' | 'coaches'>('schedules');
  loading = signal(true);
  error = signal('');
  trainId = signal<number | null>(null);
  bookingMessage = signal('');

  constructor() {
    this.route.params.subscribe(params => {
      const rawId = Number(params['id']);
      if (!Number.isFinite(rawId) || rawId <= 0) {
        this.error.set('Invalid train ID.');
        this.loading.set(false);
        return;
      }

      this.trainId.set(rawId);
      this.loadTrain(rawId);
      this.loadSchedules(rawId);
    });
  }

  goBack(): void {
    this.router.navigate(['/trains']);
  }

  setTab(tab: 'schedules' | 'coaches'): void {
    this.activeTab.set(tab);
    const id = this.trainId();
    if (id == null) return;

    if (tab === 'schedules') {
      this.loadSchedules(id);
    } else {
      this.loadCoaches(id);
    }
  }

  private loadTrain(trainId: number): void {
    this.loading.set(true);
    this.error.set('');
    this.trainsService.getTrainById(trainId).subscribe({
      next: train => {
        this.train.set(train);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set('Unable to load train data.');
        console.error(err);
      }
    });
  }

  private loadSchedules(trainId: number): void {
    this.loading.set(true);
    this.error.set('');
    this.trainsService.getTrainSchedules(trainId).subscribe({
      next: items => {
        this.schedules.set(items);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set('Unable to load schedules.');
        console.error(err);
      }
    });
  }

  private loadCoaches(trainId: number): void {
    this.loading.set(true);
    this.error.set('');
    this.trainsService.getTrainCoaches(trainId).subscribe({
      next: items => {
        this.coaches.set(items);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set('Unable to load coaches.');
        console.error(err);
      }
    });
  }

  formatTrainNumber(train: Train | null): string {
    if (!train) return '';
    const number = train.number ?? train.trainNumber ?? train.id ?? train.trainId;
    return number != null ? `Train #${number}` : 'Train';
  }

  getRouteText(train: Train | null): string {
    if (!train) return '';
    const origin = train.from ?? train.fromStation ?? train.origin ?? train.startStation ?? '';
    const destination = train.to ?? train.toStation ?? train.destination ?? train.endStation ?? '';
    return origin && destination ? `${origin} → ${destination}` : origin || destination || '';
  }

  trackBySchedule(_: number, item: TrainSchedule): number | string | null {
    return item.id ?? item.trainId ?? item.departureTime ?? null;
  }

  trackByCoach(_: number, item: TrainCoach): number | string | null {
    return item.id ?? item.number ?? item.coachNumber ?? null;
  }

  formatCoachPrice(item: TrainCoach | any): string {
    const p = item?.price ?? item?.fare ?? item?.cost ?? null;
    return p != null && p !== '' ? `₾${p}` : 'No price';
  }

  getCoachSeats(item: TrainCoach | any): string {
    const s = item?.seats ?? item?.capacity ?? item?.seatCount ?? item?.seatsCount ?? null;
    return s != null ? String(s) : 'No seats';
  }

  bookSchedule(item: TrainSchedule | any): void {
    this.bookingMessage.set('');
    const trainId = this.trainId();
    const scheduleId = item?.id ?? item?.trainId ?? null;

    if (trainId == null || scheduleId == null) {
      this.bookingMessage.set('This schedule cannot be booked right now.');
      setTimeout(() => this.bookingMessage.set(''), 3000);
      return;
    }

    this.bookingState.setSchedule(trainId, {
      id: scheduleId,
      trainId,
      origin: item?.origin,
      destination: item?.destination,
      departureTime: item?.departureTime
    });

    this.router.navigate(['/booking', trainId, scheduleId, 'coach']);
  }
}
