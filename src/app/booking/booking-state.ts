import { Injectable, signal } from '@angular/core';
import { TrainCoach } from '../models/train.model';
import { BookingSchedule } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingState {
  trainId = signal<number | null>(null);
  schedule = signal<BookingSchedule | null>(null);
  coach = signal<TrainCoach | null>(null);
  travelDate = signal<string | null>(null); // yyyy-MM-dd
  selectedSeats = signal<{ id: number; number: number | string }[]>([]);

  setSchedule(trainId: number, schedule: BookingSchedule): void {
    this.trainId.set(trainId);
    this.schedule.set(schedule);
    // starting a fresh booking invalidates anything chosen further down the flow
    this.coach.set(null);
    this.travelDate.set(null);
    this.selectedSeats.set([]);
  }

  setCoach(coach: TrainCoach): void {
    this.coach.set(coach);
    this.travelDate.set(null);
    this.selectedSeats.set([]);
  }

  setTravelDate(date: string): void {
    this.travelDate.set(date);
    this.selectedSeats.set([]);
  }

  setSeats(seats: { id: number; number: number | string }[]): void {
    this.selectedSeats.set(seats);
  }

  reset(): void {
    this.trainId.set(null);
    this.schedule.set(null);
    this.coach.set(null);
    this.travelDate.set(null);
    this.selectedSeats.set([]);
  }

  /** True once schedule + coach + date + at least one seat are picked */
  isReadyToConfirm(): boolean {
    return !!this.schedule()?.id && !!this.coach()?.id && !!this.travelDate() && this.selectedSeats().length > 0;
  }
}
