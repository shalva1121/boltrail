import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Train, TrainSchedule, TrainCoach } from '../models/train.model';

export interface Station {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TrainsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://trainsapi.stepacademy.ge/api/trains';
  private readonly stationsBaseUrl = 'https://trainsapi.stepacademy.ge/api/stations';
  private readonly pageSize = 100;

  getTrainSchedules(trainId: number): Observable<TrainSchedule[]> {
    return this.http
      .get<any>(`https://trainsapi.stepacademy.ge/api/schedules?trainId=${trainId}&Take=12&Page=1`)
      .pipe(
        map(raw => this.toScheduleArray(raw)),
        catchError(err => throwError(() => err))
      );
  }

  getTrainCoaches(trainId: number): Observable<TrainCoach[]> {
    return this.http
      .get<any>(`https://trainsapi.stepacademy.ge/api/coaches/train/${trainId}?Take=12&Page=1`)
      .pipe(
        map(raw => this.toCoachArray(raw)),
        catchError(err => throwError(() => err))
      );
  }

  getTrains(): Observable<Train[]> {
    return this.fetchPage(1).pipe(
      switchMap(trains => {
        if (!trains.length) {
          return of([]);
        }

        return forkJoin(
          trains.map(train => {
            const id = train.id ?? train.trainId;
            if (id == null) {
              return of(train);
            }

            return this.getTrainById(id).pipe(
              map(detail => ({ ...train, ...detail, schedules: detail.schedules ?? [] })),
              catchError(() => of(train))
            );
          })
        );
      }),
      tap(raw => {
        console.log('RAW API RESPONSE:', raw);
        console.log('Type:', typeof raw);
        console.log('Is array:', Array.isArray(raw));
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          console.log('Keys:', Object.keys(raw));
        }
        if (Array.isArray(raw) && raw.length > 0) {
          console.log('First item keys:', Object.keys(raw[0]));
          console.log('First item:', raw[0]);
        }
      }),
      catchError(err => {
        console.error('Trains API error:', err);
        return throwError(() => err);
      })
    );
  }

  getTrainById(id: number): Observable<Train> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(raw => this.toTrainDetail(raw)),
      catchError(err => throwError(() => err))
    );
  }

  getStations(): Observable<Station[]> {
    return this.http.get<any>(this.stationsBaseUrl).pipe(
      map(raw => this.toStationArray(raw)),
      catchError(err => throwError(() => err))
    );
  }

  getStationsFrom(stationId: number): Observable<Station[]> {
    return this.http.get<any>(`${this.stationsBaseUrl}/from/${stationId}`).pipe(
      map(raw => this.toStationArray(raw)),
      catchError(err => throwError(() => err))
    );
  }

  getStationsTo(stationId: number): Observable<Station[]> {
    return this.http.get<any>(`${this.stationsBaseUrl}/to/${stationId}`).pipe(
      map(raw => this.toStationArray(raw)),
      catchError(err => throwError(() => err))
    );
  }

  private fetchPage(page: number): Observable<Train[]> {
    return this.http.get<any>(`${this.baseUrl}?Take=${this.pageSize}&Page=${page}`).pipe(
      tap(raw => {
        console.log(`Page ${page} raw response:`, raw);
        console.log('Response keys:', raw && typeof raw === 'object' ? Object.keys(raw) : 'N/A');
      }),
      map(raw => this.toArray(raw)),
      tap(trains => console.log(`Extracted ${trains.length} trains from page ${page}`)),
      switchMap(trains => {
        if (trains.length < this.pageSize) {
          return of(trains);
        }

        return this.fetchPage(page + 1).pipe(map(next => [...trains, ...next]));
      })
    );
  }

  /** Unwrap any response shape into a plain array */
  private toArray(raw: any): Train[] {
    if (Array.isArray(raw)) return raw;

    if (raw?.data?.items && Array.isArray(raw.data.items)) {
      console.log('Found trains at data.items');
      return raw.data.items;
    }

    for (const key of ['data', 'trains', 'items', 'results', 'content', 'value', 'records']) {
      if (Array.isArray(raw?.[key])) {
        console.log(`Found trains array at key: ${key}`);
        return raw[key];
      }
    }

    if (raw && typeof raw === 'object' && raw.id) {
      console.log('Returning single object as array');
      return [raw];
    }

    console.log('Could not extract trains, returning empty array. Raw:', raw);
    return [];
  }

  private toStationArray(raw: any): Station[] {
    const normalizeStation = (item: any): Station | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      if (typeof item.id === 'number' && typeof item.name === 'string') {
        return { id: item.id, name: item.name };
      }

      return null;
    };

    if (Array.isArray(raw)) {
      return raw.map((item: any) => normalizeStation(item)).filter((item: Station | null): item is Station => !!item);
    }

    if (Array.isArray(raw?.data)) {
      return raw.data.map((item: any) => normalizeStation(item)).filter((item: Station | null): item is Station => !!item);
    }

    return [];
  }

  private toTrainDetail(raw: any): Train {
    const data = raw?.data ?? raw;
    const train = data && typeof data === 'object' ? data : {};
    const schedules = Array.isArray(train.schedules)
      ? train.schedules.map((schedule: any): TrainSchedule => ({
          id: schedule?.id,
          origin: schedule?.origin,
          destination: schedule?.destination,
          departureTime: schedule?.departureTime,
          trainId: schedule?.trainId,
          trainName: schedule?.trainName,
          trainNumber: schedule?.trainNumber
        }))
      : [];

    const firstSchedule = schedules[0];

    return {
      id: train.id ?? train.trainId,
      name: train.name ?? train.trainName ?? train.title,
      trainName: train.trainName ?? train.name ?? train.title,
      title: train.title ?? train.name ?? train.trainName,
      trainId: train.trainId ?? train.id,
      number: train.number ?? train.trainNumber,
      trainNumber: train.trainNumber ?? train.number,
      image: train.image ?? train.imageUrl ?? train.photo ?? train.thumbnail ?? train.img,
      imageUrl: train.imageUrl ?? train.image ?? train.photo ?? train.thumbnail ?? train.img,
      thumbnail: train.thumbnail ?? train.image ?? train.imageUrl ?? train.photo ?? train.img,
      totalSeats: train.totalSeats ?? train.seats ?? train.availableSeats,
      seats: train.totalSeats ?? train.seats ?? train.availableSeats,
      coaches: train.coachesCount ?? train.coaches,
      coachesCount: train.coachesCount ?? train.coaches,
      price: train.price ?? train.ticketPrice ?? train.cost,
      from: firstSchedule?.origin,
      to: firstSchedule?.destination,
      schedules
    };
  }

  private toScheduleArray(raw: any): TrainSchedule[] {
    const data = raw?.data ?? raw;
    if (Array.isArray(data)) {
      return data.map((item: any) => this.normalizeSchedule(item));
    }
    if (Array.isArray(data?.items)) {
      return data.items.map((item: any) => this.normalizeSchedule(item));
    }
    if (Array.isArray(data?.data)) {
      return data.data.map((item: any) => this.normalizeSchedule(item));
    }
    return [];
  }

  private toCoachArray(raw: any): TrainCoach[] {
    const data = raw?.data ?? raw;
    if (Array.isArray(data)) {
      return data.map((item: any) => this.normalizeCoach(item));
    }
    if (Array.isArray(data?.items)) {
      return data.items.map((item: any) => this.normalizeCoach(item));
    }
    if (Array.isArray(data?.data)) {
      return data.data.map((item: any) => this.normalizeCoach(item));
    }
    return [];
  }

  private normalizeSchedule(item: any): TrainSchedule {
    return {
      id: item?.id,
      origin: item?.origin,
      destination: item?.destination,
      departureTime: item?.departureTime,
      trainId: item?.trainId,
      trainName: item?.trainName,
      trainNumber: item?.trainNumber,
      price: item?.price ?? item?.fare ?? item?.cost,
      fare: item?.fare ?? item?.price
    };
  }

  private normalizeCoach(item: any): TrainCoach {
    return {
      id: item?.id,
      name: item?.name ?? (item?.number ? `Coach ${item.number}` : undefined),
      number: item?.number,
      coachNumber: item?.coachNumber,
      type: item?.type,
      category: item?.category,
      class: item?.class ?? item?.coachClass ?? item?.category,
      seats: item?.seats ?? item?.seatCount ?? item?.capacity,
      capacity: item?.capacity,
      price: item?.price ?? item?.fare ?? item?.cost,
      fare: item?.fare ?? item?.price
    };
  }
}
