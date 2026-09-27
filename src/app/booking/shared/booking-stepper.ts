import { Component, Input } from '@angular/core';

export type BookingStep = 'coach' | 'date' | 'seats' | 'confirm';

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  template: `
    <div class="stepper">
      @for (step of steps; track step.key; let i = $index) {
        <div class="step" [class.done]="index(step.key) < index(current)" [class.active]="step.key === current">
          <div class="dot">
            @if (index(step.key) < index(current)) {
              <span>✓</span>
            } @else {
              <span>{{ i + 1 }}</span>
            }
          </div>
          <span class="label">{{ step.label }}</span>
        </div>
        @if (i < steps.length - 1) {
          <div class="line" [class.done]="index(step.key) < index(current)"></div>
        }
      }
    </div>
  `,
  styleUrl: './booking-stepper.css'
})
export class BookingStepper {
  @Input() current: BookingStep = 'coach';

  readonly steps: { key: BookingStep; label: string }[] = [
    { key: 'coach', label: 'COACH' },
    { key: 'date', label: 'DATE' },
    { key: 'seats', label: 'SEATS' },
    { key: 'confirm', label: 'CONFIRM' }
  ];

  index(key: BookingStep): number {
    return this.steps.findIndex(s => s.key === key);
  }
}
