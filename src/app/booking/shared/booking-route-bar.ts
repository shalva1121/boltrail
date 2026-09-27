import { Component, Input } from '@angular/core';
import { BookingSchedule } from '../../models/booking.model';

@Component({
  selector: 'app-booking-route-bar',
  standalone: true,
  template: `
    <div class="route-bar">
      <span class="route-text">{{ schedule?.origin ?? 'Unknown' }} → {{ schedule?.destination ?? 'Unknown' }}</span>
      @if (schedule?.departureTime) {
        <span class="route-time">{{ formatTime(schedule!.departureTime!) }}</span>
      }
    </div>
  `,
  styleUrl: './booking-route-bar.css'
})
export class BookingRouteBar {
  @Input() schedule: BookingSchedule | null = null;

  formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
