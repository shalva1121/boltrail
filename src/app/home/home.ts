import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainsService, Station } from '../services/trains.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private readonly router = inject(Router);
  private readonly trainsService = inject(TrainsService);

  fromInput = signal('');
  toInput = signal('');
  stations = signal<Station[]>([]);
  selectedFromId = signal<number | null>(null);
  selectedToId = signal<number | null>(null);

  ngOnInit(): void {
    this.trainsService.getStations().subscribe(stations => this.stations.set(stations));
  }

  searchTrains(): void {
    const fromId = this.selectedFromId();
    const toId = this.selectedToId();
    const query: Record<string, string> = {};

    if (fromId != null) {
      query['from'] = String(fromId);
    }

    if (toId != null) {
      query['to'] = String(toId);
    }

    this.router.navigate(['/trains'], { queryParams: query });
  }

  onFromInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromInput.set(value);
    this.selectedFromId.set(this.resolveStationId(value));
  }

  onToInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toInput.set(value);
    this.selectedToId.set(this.resolveStationId(value));
  }

  private resolveStationId(value: string): number | null {
    const query = value.trim().toLowerCase();
    if (!query) {
      return null;
    }

    const match = this.stations().find(station => station.name.toLowerCase().includes(query));
    return match?.id ?? null;
  }
}
