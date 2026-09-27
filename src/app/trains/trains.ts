import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TrainsService, Station } from '../services/trains.service';
import { Train } from '../models/train.model';

@Component({
  selector: 'app-trains',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './trains.html',
  styleUrl: './trains.css'
})
export class Trains implements OnInit, OnDestroy {
  private readonly trainsService = inject(TrainsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  trains = signal<Train[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  filterFrom = signal<number | null>(null);
  filterTo = signal<number | null>(null);
  fromStationOptions = signal<Station[]>([]);
  toStationOptions = signal<Station[]>([]);
  private readonly allStations = signal<Station[]>([]);

  readonly uniqueOrigins = computed(() =>
    [...new Set(this.fromStationOptions().map(station => station.name))].sort()
  );

  readonly uniqueDestinations = computed(() =>
    [...new Set(this.toStationOptions().map(station => station.name))].sort()
  );

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const fromId = this.filterFrom();
    const toId = this.filterTo();
    return this.trains().filter(t => {
      if (q) {
        const name = this.getName(t).toLowerCase();
        const num = String(this.getNumber(t));
        if (!name.includes(q) && !num.includes(q)) return false;
      }
      if (fromId != null || toId != null) {
        if (!this.trainMatchesRoute(t, fromId, toId)) {
          return false;
        }
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.filterFrom.set(this.parseStationId(params['from']));
      this.filterTo.set(this.parseStationId(params['to']));
      this.syncStationOptions(this.filterFrom(), this.filterTo());
    });
    this.loadTrains();
    this.loadStations();
  }

  openTrainDetails(train: Train): void {
    const id = train.id ?? train.trainId;
    if (id != null) {
      this.router.navigate(['/trains', id]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrains(): void {
    this.loading.set(true);
    this.error.set(null);
    this.trainsService.getTrains()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          console.log('Trains loaded:', data.length, data);
          this.trains.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load trains. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onFromChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const fromId = this.parseStationId(target?.value);
    this.filterFrom.set(fromId);
    this.syncStationOptions(fromId, this.filterTo());
    this.applyFilters();
  }

  onToChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const toId = this.parseStationId(target?.value);
    this.filterTo.set(toId);
    this.syncStationOptions(this.filterFrom(), toId);
    this.applyFilters();
  }

  applyFilters(): void {
    const q: Record<string, string> = {};
    if (this.searchQuery()) q['search'] = this.searchQuery();
    if (this.filterFrom() != null) q['from'] = String(this.filterFrom());
    if (this.filterTo() != null) q['to'] = String(this.filterTo());
    this.router.navigate([], { relativeTo: this.route, queryParams: q, replaceUrl: true });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterFrom.set(null);
    this.filterTo.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.filterFrom() != null || this.filterTo() != null);
  }

  getName(t: Train): string {
    return t.name ?? t.trainName ?? t.title ?? `Train #${t.id ?? t.trainId ?? '?'}`;
  }

  getNumber(t: Train): string {
    const n = t.number ?? t.trainNumber ?? t.id ?? t.trainId;
    return n != null ? `#${n}` : '';
  }

  getFrom(t: Train): string {
    return t.from ?? t.fromStation ?? t.origin ?? t.departure ?? t.startStation ?? '';
  }

  getTo(t: Train): string {
    return t.to ?? t.toStation ?? t.destination ?? t.arrival ?? t.endStation ?? '';
  }

  getSeats(t: Train): number | null {
    return t.seats ?? t.totalSeats ?? t.availableSeats ?? t.seatCount ?? t.seatsCount ?? null;
  }

  getCoaches(t: Train): number | null {
    return t.coaches ?? t.numberOfCoaches ?? t.coachCount ?? t.numCoaches ?? t.coachesCount ?? null;
  }

  getImage(t: Train): string | null {
    return t.image ?? t.imageUrl ?? t.photo ?? t.thumbnail ?? t.img ?? null;
  }

  getPrice(t: Train): number | null {
    return t.price ?? t.ticketPrice ?? t.cost ?? null;
  }

  getTrainId(t: Train): number | null {
    return t.id ?? t.trainId ?? null;
  }

  private parseStationId(value: string | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private syncStationOptions(fromId: number | null, toId: number | null): void {
    if (fromId != null && toId == null) {
      this.loadStationsFrom(fromId);
      return;
    }

    if (toId != null && fromId == null) {
      this.loadStationsTo(toId);
      return;
    }

    if (fromId == null && toId == null) {
      if (this.allStations().length > 0) {
        this.fromStationOptions.set(this.allStations());
        this.toStationOptions.set(this.allStations());
      } else {
        this.loadStations();
      }
      return;
    }

    if (this.allStations().length > 0) {
      this.fromStationOptions.set(this.allStations());
      this.toStationOptions.set(this.allStations());
    } else {
      this.loadStations();
    }
  }

  private loadStations(): void {
    this.trainsService.getStations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.mergeStations(data);
          this.fromStationOptions.set(data);
          this.toStationOptions.set(data);
        },
        error: () => {
          this.fromStationOptions.set([]);
          this.toStationOptions.set([]);
        }
      });
  }

  private loadStationsFrom(stationId: number): void {
    this.trainsService.getStationsFrom(stationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.mergeStations(data);
          this.toStationOptions.set(data);
        },
        error: () => {
          this.toStationOptions.set([]);
        }
      });
  }

  private loadStationsTo(stationId: number): void {
    this.trainsService.getStationsTo(stationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.mergeStations(data);
          this.fromStationOptions.set(data);
        },
        error: () => {
          this.fromStationOptions.set([]);
        }
      });
  }

  private mergeStations(next: Station[]): void {
    const merged = new Map(this.allStations().map(station => [station.id, station]));
    next.forEach(station => merged.set(station.id, station));
    this.allStations.set(Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }

  private getStationName(stationId: number): string {
    return this.allStations().find(station => station.id === stationId)?.name ?? '';
  }

  private trainMatchesRoute(train: Train, fromId: number | null, toId: number | null): boolean {
    const fromName = fromId != null ? this.getStationName(fromId).toLowerCase() : '';
    const toName = toId != null ? this.getStationName(toId).toLowerCase() : '';

    const schedules = train.schedules ?? [];
    if (schedules.length === 0) {
      return false;
    }

    return schedules.some(schedule => {
      const origin = (schedule.origin ?? '').toLowerCase();
      const destination = (schedule.destination ?? '').toLowerCase();

      if (fromName && toName) {
        return origin.includes(fromName) && destination.includes(toName);
      }

      if (fromName) {
        return origin.includes(fromName);
      }

      if (toName) {
        return destination.includes(toName);
      }

      return true;
    });
  }
}
