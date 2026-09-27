import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  pictureUrl?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  data?: { token?: string; accessToken?: string };
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authUrl = 'https://trainsapi.stepacademy.ge/api/auth';
  private readonly apiUrl = 'https://trainsapi.stepacademy.ge/api';

  isLoggedIn = signal<boolean>(this.hasToken());

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, payload).pipe(
      tap(res => this.handleAuthResponse(res)),
      catchError(err => throwError(() => err))
    );
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, payload).pipe(
      tap(res => this.handleAuthResponse(res)),
      catchError(err => throwError(() => err))
    );
  }

  forgotPassword(email: string): Observable<any> {
    const encodedEmail = encodeURIComponent(email);
    return this.http.get<any>(`${this.authUrl}/forget-password/${encodedEmail}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.authUrl}/verify-email`, payload).pipe(
      tap(res => this.handleAuthResponse(res)),
      catchError(err => throwError(() => err))
    );
  }

  getUser(): Observable<UserProfile> {
    return this.http.get<any>(`${this.apiUrl}/users/me`, this.authHeaders()).pipe(
      map(res => {
        const payload = res?.data ?? res;
        const details = payload?.details ?? {};

        return {
          ...payload,
          ...details,
          phone: payload.phone ?? details.phoneNumber,
          address: payload.address ?? details.address,
          dateOfBirth: payload.dateOfBirth ?? details.dob,
          pictureUrl: payload.pictureUrl ?? details.pictureUrl,
        } as UserProfile;
      }),
      catchError(err => throwError(() => err))
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/change-password`, payload, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteProfile(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/delete-profile`, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateUser(payload: UserProfile): Observable<UserProfile> {
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      details: {
        phoneNumber: payload.phone,
        address: payload.address,
        dob: payload.dateOfBirth,
        pictureUrl: payload.pictureUrl,
      }
    };

    return this.http.put<UserProfile>(`${this.apiUrl}/users`, body, this.authHeaders()).pipe(
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.isLoggedIn.set(false);
    this.router.navigate(['/sign-in']);
  }

  private authHeaders() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private handleAuthResponse(res: AuthResponse): void {
    const token =
      res?.token ??
      res?.accessToken ??
      res?.data?.token ??
      res?.data?.accessToken;

    if (token) {
      localStorage.setItem('auth_token', token);
      this.isLoggedIn.set(true);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}
